import os
import sys
import logging
from quality import run_quality_rules

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("${{ name }}")

def run_pipeline():
    logger.info("Starting ingestion pipeline for datasource: ${{ dataSource }}")
    
    # 1. Simulate data retrieval
    raw_data = {"source": "${{ dataSource }}", "records": [{"id": 1, "evidence": "Efficacy demonstrated in target cohort."}]}
    logger.info(f"Ingested {len(raw_data['records'])} records from ${{ dataSource }}.")
    
    # 2. Bronze Layer: Write raw payload to object store (MinIO simulated path)
    bronze_path = "s3://bronze-bucket/${{ name }}/raw_data.json"
    logger.info(f"Bronze layer write completed to: {bronze_path}")

    # 3. Data Quality validations (Silver transition)
    {%- if qualityChecks %}
    logger.info("Executing silver promotion quality checks...")
    success = run_quality_rules(raw_data)
    if not success:
        logger.error("Quality gates failed. Aborting promotion to Silver/Gold.")
        sys.exit(1)
    {%- endif %}

    # 4. Silver Layer: Ingest to Apache Iceberg table format
    logger.info("Promoting data to Silver layer (Apache Iceberg format: default.evidence_silver)")
    
    # 5. Gold Layer: Run aggregation/synthesis preparation
    logger.info("Gold layer aggregations generated successfully.")

if __name__ == "__main__":
    run_pipeline()
