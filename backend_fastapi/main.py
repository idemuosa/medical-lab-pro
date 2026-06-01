from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random

app = FastAPI(title="MedLab Pro - High Speed API")

class AIAnalysisRequest(BaseModel):
    patient_id: str
    lab_results: dict

@app.get("/")
async def root():
    return {
        "message": "MedLab Pro FastAPI Service Online",
        "system_load": f"{random.randint(5, 25)}%",
        "active_processes": random.randint(100, 500),
        "prediction_engine": "Active"
    }

@app.get("/stats")
async def get_stats():
    # Mock analytics data for the dashboard
    return {
        "daily_tests": [random.randint(10, 50) for _ in range(7)],
        "revenue_trend": [random.randint(1000, 5000) for _ in range(7)],
        "abnormal_rate": f"{random.uniform(5, 15):.1f}%"
    }

@app.post("/analyze-results")
async def analyze_results(request: AIAnalysisRequest):
    return {
        "status": "Success",
        "insight": "AI-Driven insight based on patient lab data",
        "alerts": ["Glucose elevated", "Hemoglobin stable"]
    }
