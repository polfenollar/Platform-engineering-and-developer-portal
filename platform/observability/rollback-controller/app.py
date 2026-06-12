"""
==============================================================================
Stage 2 — Rollback Controller (Hardened)
Fixes: G3 (raw PAT commits to main), SPOF-6 (no probes/dedup), FB-2 (no retry queue)

Architecture:
  - Fast-path:  Alert fires → immediately disable flag via Flipt API (< 1s)
  - Slow-path:  Open a GitHub PR to reconcile Git state (async, retryable)
  - Dedup:      5-minute cooldown per flag prevents alert storms
  - /healthz:   Kubernetes liveness/readiness probe endpoint
  - Idempotent: Safe to run 2 replicas simultaneously
==============================================================================
"""
import os
import json
import time
import logging
import hashlib
import threading
from datetime import datetime, timezone
from flask import Flask, request, jsonify
import requests

# ---------------------------------------------------------------------------
# Structured JSON logging (FluentBit-compatible)
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","msg":"%(message)s"}',
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
log = logging.getLogger(__name__)

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Configuration from environment (injected by ESO/K8s)
# ---------------------------------------------------------------------------
GITHUB_TOKEN      = os.environ["GITHUB_TOKEN"]
GITHUB_REPO       = os.environ.get("GITHUB_REPO", "polfenollar/Platform-engineering-and-developer-portal")
GITHUB_BRANCH     = os.environ.get("GITHUB_BRANCH", "main")
FEATURES_FILE     = os.environ.get("FEATURES_FILE_PATH", "platform/feature-flags/features.json")
FLIPT_API_URL     = os.environ.get("FLIPT_API_URL", "http://flipt.platform.svc.cluster.local:8080")
PORT              = int(os.environ.get("PORT", 5000))
COOLDOWN_SECONDS  = int(os.environ.get("COOLDOWN_SECONDS", 300))   # 5-minute dedup window
GH_API            = "https://api.github.com"

# ---------------------------------------------------------------------------
# Deduplication Cache — thread-safe
# Key: flag_name, Value: last_triggered UNIX timestamp
# ---------------------------------------------------------------------------
_dedup_lock  = threading.Lock()
_dedup_cache: dict[str, float] = {}

# Retry Queue for GitHub PR creation (FB-2 fix)
_retry_lock  = threading.Lock()
_retry_queue: list[dict] = []


def _is_duplicate(flag_name: str) -> bool:
    """Return True if this flag was already handled within the cooldown window."""
    with _dedup_lock:
        last = _dedup_cache.get(flag_name, 0)
        now  = time.time()
        if now - last < COOLDOWN_SECONDS:
            return True
        _dedup_cache[flag_name] = now
        return False


# ---------------------------------------------------------------------------
# Fast-path: disable feature flag via Flipt REST API
# ---------------------------------------------------------------------------
def flipt_disable_flag(flag_name: str) -> bool:
    """
    Attempt to disable a Flipt flag via its REST API.
    Returns True on success, False on any error.
    """
    url = f"{FLIPT_API_URL}/api/v1/flags/{flag_name}"
    try:
        # First, GET the current flag to preserve all its fields
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        flag_data = resp.json()

        # PATCH — set enabled: false only
        patch_resp = requests.put(
            url,
            json={**flag_data, "enabled": False},
            timeout=5,
        )
        patch_resp.raise_for_status()
        log.info(f"Fast-path: disabled flag '{flag_name}' via Flipt API")
        return True
    except requests.RequestException as exc:
        log.warning(f"Fast-path failed for flag '{flag_name}': {exc}")
        return False


# ---------------------------------------------------------------------------
# Slow-path: open a GitHub Pull Request to reconcile Git state
# ---------------------------------------------------------------------------
def _github_headers() -> dict:
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _get_file_sha() -> tuple[str, dict]:
    """Fetch current features.json content and its SHA from GitHub."""
    url = f"{GH_API}/repos/{GITHUB_REPO}/contents/{FEATURES_FILE}?ref={GITHUB_BRANCH}"
    resp = requests.get(url, headers=_github_headers(), timeout=10)
    resp.raise_for_status()
    data = resp.json()
    import base64
    content = json.loads(base64.b64decode(data["content"]).decode())
    return data["sha"], content


def _create_pr(flag_name: str) -> bool:
    """
    Create a branch, commit the flag disable to it, and open a PR.
    Never commits directly to main. Returns True on success.
    """
    branch_name = f"rollback/{flag_name}-{int(time.time())}"
    timestamp   = datetime.now(timezone.utc).isoformat()

    try:
        # 1. Get main branch SHA
        ref_resp = requests.get(
            f"{GH_API}/repos/{GITHUB_REPO}/git/ref/heads/{GITHUB_BRANCH}",
            headers=_github_headers(), timeout=10,
        )
        ref_resp.raise_for_status()
        main_sha = ref_resp.json()["object"]["sha"]

        # 2. Create new branch from main
        requests.post(
            f"{GH_API}/repos/{GITHUB_REPO}/git/refs",
            headers=_github_headers(),
            json={"ref": f"refs/heads/{branch_name}", "sha": main_sha},
            timeout=10,
        ).raise_for_status()

        # 3. Get current file content + SHA
        file_sha, features = _get_file_sha()

        # 4. Disable the flag in the JSON
        modified = False
        for flag in features.get("flags", []):
            if flag.get("key") == flag_name:
                flag["enabled"] = False
                modified = True
                break

        if not modified:
            log.warning(f"Flag '{flag_name}' not found in {FEATURES_FILE} — skipping PR")
            return True  # Not an error — flag may not exist in Git yet

        # 5. Commit modified file to new branch
        import base64
        new_content = base64.b64encode(
            json.dumps(features, indent=2).encode()
        ).decode()

        requests.put(
            f"{GH_API}/repos/{GITHUB_REPO}/contents/{FEATURES_FILE}",
            headers=_github_headers(),
            json={
                "message": f"chore(rollback): disable flag '{flag_name}' [automated]\n\nTriggered by Alertmanager at {timestamp}.\nDo not merge without verifying the incident is resolved.",
                "content": new_content,
                "sha": file_sha,
                "branch": branch_name,
            },
            timeout=10,
        ).raise_for_status()

        # 6. Open Pull Request
        pr_resp = requests.post(
            f"{GH_API}/repos/{GITHUB_REPO}/pulls",
            headers=_github_headers(),
            json={
                "title": f"🚨 [Automated Rollback] Disable flag: {flag_name}",
                "body": (
                    f"## Automated Rollback\n\n"
                    f"**Flag**: `{flag_name}`\n"
                    f"**Triggered**: {timestamp}\n"
                    f"**Source**: Alertmanager → Rollback Controller\n\n"
                    f"The flag has already been disabled at runtime via the Flipt API (fast-path).\n"
                    f"This PR reconciles the Git source-of-truth.\n\n"
                    f"> ⚠️ **Do not merge until the incident is fully resolved and tested.**"
                ),
                "head": branch_name,
                "base": GITHUB_BRANCH,
                "draft": False,
            },
            timeout=10,
        )
        pr_resp.raise_for_status()
        pr_url = pr_resp.json()["html_url"]
        log.info(f"Slow-path: PR created for flag '{flag_name}': {pr_url}")
        return True

    except requests.RequestException as exc:
        log.error(f"Slow-path PR creation failed for flag '{flag_name}': {exc}")
        return False


def _enqueue_retry(flag_name: str):
    """Add a failed PR to the retry queue (FB-2 fix)."""
    with _retry_lock:
        _retry_queue.append({
            "flag_name": flag_name,
            "next_attempt": time.time() + 300,  # retry in 5 minutes
            "attempts": 0,
        })
    log.info(f"Enqueued '{flag_name}' for PR retry")


def _retry_worker():
    """Background thread: retry failed PR creations every 5 minutes."""
    while True:
        time.sleep(60)
        with _retry_lock:
            pending = [item for item in _retry_queue if time.time() >= item["next_attempt"]]
            for item in pending:
                if item["attempts"] >= 10:
                    log.error(f"Giving up on PR for '{item['flag_name']}' after 10 attempts")
                    _retry_queue.remove(item)
                    continue
                if _create_pr(item["flag_name"]):
                    _retry_queue.remove(item)
                else:
                    item["attempts"] += 1
                    item["next_attempt"] = time.time() + 300


# ---------------------------------------------------------------------------
# Webhook endpoint — called by Alertmanager
# ---------------------------------------------------------------------------
@app.route("/webhook", methods=["POST"])
def webhook():
    payload = request.get_json(silent=True) or {}
    alerts  = payload.get("alerts", [])

    if not alerts:
        return jsonify({"status": "no alerts"}), 200

    processed, skipped = [], []

    for alert in alerts:
        if alert.get("status") != "firing":
            log.info(f"Ignoring non-firing alert: {alert.get('status')}")
            continue

        flag_name = alert.get("labels", {}).get("flag_name")
        if not flag_name:
            log.warning("Alert missing 'flag_name' label — skipping")
            continue

        if _is_duplicate(flag_name):
            log.info(f"Deduplication: skipping '{flag_name}' (within {COOLDOWN_SECONDS}s cooldown)")
            skipped.append(flag_name)
            continue

        log.info(f"Processing alert for flag '{flag_name}'")

        # Fast-path: disable at runtime immediately
        fast_ok = flipt_disable_flag(flag_name)

        # Slow-path: open PR to reconcile Git (async, non-blocking)
        pr_thread = threading.Thread(
            target=lambda f=flag_name: _create_pr(f) or _enqueue_retry(f),
            daemon=True,
        )
        pr_thread.start()

        processed.append({
            "flag": flag_name,
            "fast_path": "ok" if fast_ok else "failed",
            "slow_path": "pr_queued",
        })

    return jsonify({
        "status": "processed",
        "processed": processed,
        "skipped": skipped,
    }), 200


# ---------------------------------------------------------------------------
# Health endpoints for Kubernetes probes (SPOF-6 fix)
# ---------------------------------------------------------------------------
@app.route("/healthz", methods=["GET"])
def healthz():
    """Liveness probe — returns 200 if the process is alive."""
    return jsonify({"status": "ok", "time": datetime.now(timezone.utc).isoformat()}), 200


@app.route("/readyz", methods=["GET"])
def readyz():
    """
    Readiness probe — verifies Flipt and GitHub API are reachable.
    Returns 503 if dependencies are down so this pod is removed from LB.
    """
    checks = {}

    # Check Flipt
    try:
        resp = requests.get(f"{FLIPT_API_URL}/health", timeout=3)
        checks["flipt"] = "ok" if resp.ok else f"http_{resp.status_code}"
    except Exception as exc:
        checks["flipt"] = f"error: {exc}"

    # Check GitHub API (light call)
    try:
        resp = requests.get(f"{GH_API}/rate_limit", headers=_github_headers(), timeout=3)
        checks["github"] = "ok" if resp.ok else f"http_{resp.status_code}"
    except Exception as exc:
        checks["github"] = f"error: {exc}"

    all_ok = all(v == "ok" for v in checks.values())
    return jsonify({"status": "ready" if all_ok else "degraded", "checks": checks}), (200 if all_ok else 503)


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Start retry worker background thread
    threading.Thread(target=_retry_worker, daemon=True).start()
    log.info(f"Rollback controller starting on port {PORT}")
    app.run(host="0.0.0.0", port=PORT, threaded=True)
