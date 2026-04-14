import React, { useState } from 'react';
import { Car, AlertTriangle, Ambulance, Activity } from 'lucide-react';

export default function Controls() {
    const [latency, setLatency] = useState(0);
    const [packetLoss, setPacketLoss] = useState(0);

    const handleAddVehicle = async (type = 'normal') => {
        try {
            await fetch('http://localhost:4000/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ speed: 120, type })
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleTriggerHazard = async () => {
        try {
            await fetch('http://localhost:4000/api/hazards', { method: 'POST' });
        } catch (e) {
            console.error(e);
        }
    };

    const handleNetworkChange = async (l, p) => {
        setLatency(l);
        setPacketLoss(p);
        try {
            await fetch('http://localhost:4000/api/network', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latency: l, packetLoss: p })
            });
        } catch (e) { }
    };

    return (
        <div className="controls-panel panel">
            <div className="button-group" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button onClick={() => handleAddVehicle('normal')}>
                    <Car size={16} /> Spawn Vehicle
                </button>
                <button className="warning" onClick={() => handleAddVehicle('emergency')}>
                    <Ambulance size={16} /> Emergency Vehicle
                </button>
                <button className="danger" onClick={handleTriggerHazard}>
                    <AlertTriangle size={16} /> Trigger Hazard
                </button>
            </div>

            <div className="sliders" style={{ display: 'flex', gap: '24px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                <div className="slider-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Latency ({latency}ms)</label>
                    <input type="range" min="0" max="1000" step="50" value={latency} onChange={(e) => handleNetworkChange(parseInt(e.target.value), packetLoss)} />
                </div>
                <div className="slider-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Packet Loss ({Math.round(packetLoss * 100)}%)</label>
                    <input type="range" min="0" max="0.9" step="0.1" value={packetLoss} onChange={(e) => handleNetworkChange(latency, parseFloat(e.target.value))} />
                </div>
                <div className="slider-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--danger-color)', maxWidth: '150px' }}>
                        Increase to see vehicles crash due to dropped frames!
                    </div>
                </div>
            </div>
        </div>
    );
}
