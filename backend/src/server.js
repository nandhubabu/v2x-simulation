const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const SimulationEngine = require('./simulationEngine');
const networkSimulator = require('./network');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const engine = new SimulationEngine();

let aiPredictions = {};

// Start simulation loop
setInterval(() => {
    engine.tick();
    const state = engine.getState();

    // Inject AI predictions into state
    state.aiPredictions = aiPredictions;

    // Broadcast via network simulator (applies latency/loss)
    networkSimulator.broadcast(wss, state);
}, engine.tickRate);

// Stream data to Python AI service every 1 second
setInterval(async () => {
    const state = engine.getState();
    if (state.vehicles.length === 0) return;

    try {
        const payload = {
            vehicles: state.vehicles.map(v => ({
                id: v.id, x: v.x, y: v.y, speed: v.speed, direction: v.direction
            }))
        };
        const res = await axios.post('http://127.0.0.1:8000/predict_trajectories', payload);
        aiPredictions = res.data.predictions || {};
    } catch (e) {
        // AI service might be down, that's okay, ignore softly
        // console.error("AI service unreachable -", e.message);
    }
}, 1000);

// API Routes to control simulation
app.post('/api/vehicles', (req, res) => {
    const { speed, type } = req.body;
    // Graph routing is automatic
    const v = engine.addVehicle(null, null, speed || 100, type || 'normal');
    if (!v) return res.status(400).json({ error: "Could not create path" });
    res.json({ success: true, vehicle: v });
});

app.post('/api/hazards', (req, res) => {
    const { x, y } = req.body;
    // Just map to middle of graph for simplicity if not provided
    engine.triggerHazard(x || 400, y || 400);
    res.json({ success: true });
});

app.post('/api/network', (req, res) => {
    const { latency, packetLoss } = req.body;
    networkSimulator.setParams(latency || 0, packetLoss || 0);
    res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Backend simulation server running on http://localhost:${PORT}`);
});
