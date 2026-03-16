/**
 * Typed API client for shipment endpoints.
 * All network calls go through this module — no fetch() scattered in components.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface ShipmentTimelineEvent {
  status: string;
  description: string;
  occurredAt: string; // ISO-8601
  location: string;
}

export interface ShipmentTimelineResponse {
  shipmentId: string;
  events: ShipmentTimelineEvent[];
}

export async function fetchShipmentTimeline(
  shipmentId: string,
  token: string,
): Promise<ShipmentTimelineResponse> {
  const res = await fetch(`${API_BASE}/api/shipments/${encodeURIComponent(shipmentId)}/timeline`, {
    headers: { Authorization: `Bearer ${token}` },
    // Next.js ISR — fresh enough for tracking
    ...(typeof window === 'undefined' && { next: { revalidate: 30 } } as object),
  });

  if (res.status === 404) {
    throw new Error(`Shipment ${shipmentId} not found`);
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch timeline: ${res.status}`);
  }

  return res.json() as Promise<ShipmentTimelineResponse>;
}
