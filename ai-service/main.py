import random
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

class VehicleState(BaseModel):
    id: str
    x: float
    y: float
    speed: float
    direction: str

class Payload(BaseModel):
    vehicles: List[VehicleState]

@app.post("/predict_trajectories")
def predict_trajectories(payload: Payload):
    predictions = {}
    # Simple linear kinematics predictor: project 2 seconds into future
    predict_time_s = 2.0
    
    for v in payload.vehicles:
        distance = v.speed * predict_time_s
        new_x, new_y = v.x, v.y
        
        if v.direction == 'N':
            new_y -= distance
        elif v.direction == 'S':
            new_y += distance
        elif v.direction == 'E':
            new_x += distance
        elif v.direction == 'W':
            new_x -= distance
            
        predictions[v.id] = {
            "predicted_x": new_x,
            "predicted_y": new_y
        }
        
    return {"predictions": predictions}

@app.post("/rl_message_policy")
def rl_message_policy(payload: Payload):
    decisions = {}
    for v in payload.vehicles:
        # Dummy RL threshold: simulate an agent learning to save bandwidth
        if v.speed > 0:
            # Simulate RL policy choosing to drop 50% non-critical messages
            decisions[v.id] = 0 if random.random() < 0.5 else 1
        else:
            decisions[v.id] = 1
    return {"decisions": decisions}

@app.get("/health")
def health_check():
    return {"status": "ok"}
