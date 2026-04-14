import React from 'react';
import { Activity, ShieldAlert, Zap } from 'lucide-react';

export default function Dashboard({ metrics, vehicleCount }) {
    return (
        <div className="panel dashboard">
            <div className="header">
                <div>
                    <h1 className="title">V2X Connect</h1>
                    <p className="subtitle">Real-Time Traffic Simulation</p>
                </div>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-label">
                        <Activity size={14} color="#3b82f6" />
                        Active Cars
                    </div>
                    <div className="metric-value">{vehicleCount}</div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">
                        <ShieldAlert size={14} color="#ef4444" />
                        Collisions Risk
                    </div>
                    <div className="metric-value">{Math.round(metrics.collisions || 0)}</div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">
                        <Zap size={14} color="#f59e0b" />
                        Active Hazards
                    </div>
                    <div className="metric-value">{metrics.activeHazards || 0}</div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">
                        <Activity size={14} color="#10b981" />
                        Bandwidth Saved (kb)
                    </div>
                    <div className="metric-value">{Math.round((metrics.bandwidthSaved || 0) * 0.08)}</div>
                </div>
            </div>
        </div>
    );
}
