const axios = require('axios');
const Vehicle = require('./vehicle');
const TrafficLight = require('./trafficLight');
const { getDistance } = require('./utils');
const { graph, getRandomNode, findPath } = require('./mapGraph');

class SimulationEngine {
    constructor() {
        this.vehicles = [];

        // Traffic lights on graph intersections
        this.trafficLights = [
            new TrafficLight('tl-B', graph.nodes['B'].x, graph.nodes['B'].y, 'green'),
            new TrafficLight('tl-C', graph.nodes['C'].x, graph.nodes['C'].y, 'red'),
            new TrafficLight('tl-F', graph.nodes['F'].x, graph.nodes['F'].y, 'red'),
            new TrafficLight('tl-I', graph.nodes['I'].x, graph.nodes['I'].y, 'green'),
        ];
        this.hazards = [];
        this.tickRate = 100; // 100ms
        this.metrics = {
            collisions: 0,
            activeHazards: 0,
            messagesSent: 0,
            bandwidthSaved: 0
        };
        this.tickCount = 0;
    }

    async fetchRLPolicy() {
        const payload = this.vehicles.map(v => ({ id: v.id, x: v.x, y: v.y, speed: v.speed, direction: v.direction }));
        if (payload.length === 0) return;
        try {
            const res = await axios.post('http://127.0.0.1:8000/rl_message_policy', { vehicles: payload });
            const decisions = res.data.decisions;
            this.vehicles.forEach(v => {
                if (decisions[v.id] !== undefined) v.rlTransmitFlag = decisions[v.id];
            });
        } catch (err) {
            // Ignore AI service block
        }
    }

    addVehicle(startNodeId, goalNodeId, speed, type) {
        if (!startNodeId) startNodeId = getRandomNode();
        if (!goalNodeId) {
            goalNodeId = getRandomNode();
            while (goalNodeId === startNodeId) goalNodeId = getRandomNode();
        }
        const path = findPath(startNodeId, goalNodeId);
        if (path.length < 2) return null; // no path

        const v = new Vehicle(startNodeId, goalNodeId, speed, type);
        this.vehicles.push(v);
        return v;
    }

    triggerHazard(x, y) {
        this.hazards.push({ id: 'h-' + Math.random().toString(36).substr(2, 9), x, y, activeTime: 10000 });
    }

    tick() {
        this.tickCount++;
        if (this.tickCount % 10 === 0) {
            this.fetchRLPolicy();
        }

        // 1. Check for Emergency Vehicles to give priority
        const emergencyActive = this.vehicles.some(v => v.type === 'emergency' && v.status !== 'done');

        // 2. Update Traffic Lights
        this.trafficLights.forEach(tl => tl.update(this.tickRate, emergencyActive));

        // 3. Update Hazards
        this.hazards = this.hazards.filter(h => {
            h.activeTime -= this.tickRate;
            return h.activeTime > 0;
        });
        this.metrics.activeHazards = this.hazards.length;

        // Remove done vehicles
        this.vehicles = this.vehicles.filter(v => v.status !== 'done');

        if (this.metrics.collisions > 0) {
            this.metrics.collisions -= 0.1;
            if (this.metrics.collisions < 0) this.metrics.collisions = 0;
        }

        // 4. Update Vehicles & V2V/V2I logic
        for (let i = 0; i < this.vehicles.length; i++) {
            let v = this.vehicles[i];
            if (v.status === 'done') continue;

            v.status = 'moving';
            v.speed = v.baseSpeed;

            // V2X Hazard check
            const nearHazard = this.hazards.some(h => getDistance(v.x, v.y, h.x, h.y) < 150);
            if (nearHazard) {
                v.status = 'slowing_hazard';
                v.speed = 0; // Stop completely for danger
            }

            // V2I Traffic Light Check
            const nearLight = this.trafficLights.find(tl => getDistance(v.x, v.y, tl.x, tl.y) < 40);
            if (nearLight && nearLight.state !== 'green' && v.type !== 'emergency') {
                v.status = 'stopped';
                v.speed = 0;
            }

            // V2V Collision Detection & Platooning
            let collisionDetected = false;
            let platoonLeaderSpeed = null;
            for (let j = 0; j < this.vehicles.length; j++) {
                if (i === j) continue;
                let otherV = this.vehicles[j];
                if (otherV.status === 'done') continue;

                let dist = getDistance(v.x, v.y, otherV.x, otherV.y);

                // Basic radius collision
                if (dist < 20) {
                    collisionDetected = true;
                }

                // Platooning
                if (v.direction === otherV.direction && dist < 60 && dist > 20) {
                    let ahead = false;
                    if (v.direction === 'N' && otherV.y < v.y) ahead = true;
                    if (v.direction === 'S' && otherV.y > v.y) ahead = true;
                    if (v.direction === 'E' && otherV.x > v.x) ahead = true;
                    if (v.direction === 'W' && otherV.x < v.x) ahead = true;

                    if (ahead && v.type !== 'emergency') {
                        platoonLeaderSpeed = otherV.speed;
                    }
                }
            }

            if (collisionDetected) {
                v.status = 'collision_warning';
                // We do NOT set v.speed = 0 here. 
                // If they stop, they deadlock the intersection forever. 
                // They will visually glow red to indicate a collision but keep moving to clear the intersection.
                if (Math.random() < 0.1) this.metrics.collisions += 1;
            } else if (platoonLeaderSpeed !== null && v.status !== 'stopped' && v.status !== 'slowing_hazard') {
                // Adjust speed to platoon leader to avoid rear-end collision
                v.speed = Math.min(v.speed, platoonLeaderSpeed * 0.9);
            }

            // Update position
            v.updatePosition(this.tickRate);
        }
    }

    getState() {
        let broadcastVehicles = [];
        this.vehicles.forEach(v => {
            let forceTransmit = (v.status === 'collision_warning' || v.status === 'slowing_hazard' || v.type === 'emergency');
            let rlTransmit = v.rlTransmitFlag !== undefined ? v.rlTransmitFlag : 1;

            if (forceTransmit || rlTransmit) {
                broadcastVehicles.push(v);
                this.metrics.messagesSent += 1;
            } else {
                // Drop payload to save bandwidth, push minimal dead-reckoning marker
                broadcastVehicles.push({ id: v.id, speed: v.speed, direction: v.direction, __dropped: true });
                this.metrics.bandwidthSaved += 1;
            }
        });

        return {
            vehicles: broadcastVehicles,
            trafficLights: this.trafficLights,
            hazards: this.hazards,
            metrics: this.metrics,
            graph: graph
        };
    }
}

module.exports = SimulationEngine;
