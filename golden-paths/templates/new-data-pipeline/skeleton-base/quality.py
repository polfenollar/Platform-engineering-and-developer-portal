import logging

logger = logging.getLogger("quality_checks")

def run_quality_rules(data: dict) -> bool:
    """Verifies fields are present and records count is valid."""
    logger.info("Verifying schema conformity and record bounds...")
    
    if "records" not in data or len(data["records"]) == 0:
        logger.warning("Data quality validation failed: 'records' key is missing or empty.")
        return False
        
    for record in data["records"]:
        if "evidence" not in record or not record["evidence"]:
            logger.warning(f"Record {record.get('id')} lacks an 'evidence' field.")
            return False
            
    logger.info("All quality checks passed.")
    return True
