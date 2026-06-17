import os
import structlog
from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.JSONRenderer(),
    ]
)
logger = structlog.get_logger()

app = FastAPI(title="FastAPI Service")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/")
def read_root():
    logger.info("root_accessed", correlation_id="tbd")
    return {"message": "Hello from Python FastAPI microservice!"}

# Instrument with OpenTelemetry
FastAPIInstrumentor.instrument_app(app)
