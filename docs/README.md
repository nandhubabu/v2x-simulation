# V2X Simulation System

A complete real-time Vehicle-to-Vehicle (V2V) and Vehicle-to-Everything (V2X) communication simulation system.

## Tech Stack
- Frontend: React.js (Vite) + HTML5 Canvas, Sleek Modern UI.
- Backend: Node.js + Express + WebSocket (Realtime state).
- AI Service: Python + FastAPI (Prediction Scaffold).

## Architecture
The system relies on a central Node.js server that acts as the real-time simulation engine and message broker. Vehicles broadcast their state to the server, and the server broadcasts the global state back to all connected clients (frontend) at a tick rate of 100ms.
- **V2V (Vehicle-to-Vehicle):** Collision warnings are detected if vehicles get too close.
- **V2I (Vehicle-to-Infrastructure):** Traffic lights change based on emergency vehicle priority.
- **V2X (Vehicle-to-Everything):** Vehicles slow down when approaching a broadcasted hazard.

## Getting Started

### 1. Start Backend Server
```bash
cd backend
npm install
node src/server.js
```

### 2. Start Frontend UI
```bash
cd frontend
npm install
npm run dev
```

### 3. Start AI Service (Optional)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload
```

## Features Demonstrated
1. **Collision Risk:** Vehicles dynamically detect each other. Overlapping vehicles trigger a visual collision warning.
2. **Hazard Alerts:** Clicking "Trigger Hazard" drops a hazard node. Approaching vehicles automatically slow down.
3. **Emergency Priority:** Emitting an emergency vehicle forces traffic lights to turn green along its path.
