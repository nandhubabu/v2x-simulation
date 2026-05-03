import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Dashboard from './components/Dashboard';
import Controls from './components/Controls';
import Scene3D from './components/Scene3D';
import CollisionPanel from './components/CollisionPanel';
import './index.css';

function App() {
  const [simulationState, setSimulationState] = useState({
    vehicles: [], trafficLights: [], hazards: [], metrics: { collisions: 0, activeHazards: 0 }, graph: null, aiPredictions: {}
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSimulationState(prevState => {
          let prevVMap = {};
          if (prevState.vehicles) prevState.vehicles.forEach(v => prevVMap[v.id] = v);

          let mergedVehicles = data.vehicles.map(v => {
            if (v.__dropped && prevVMap[v.id]) {
              // Interpolate dead reckoning based on last known speed
              let oldV = prevVMap[v.id];
              let newV = { ...oldV, status: 'cruising' };
              let distance = oldV.speed * 0.1; // 100ms
              if (oldV.direction === 'N') newV.y -= distance;
              else if (oldV.direction === 'S') newV.y += distance;
              else if (oldV.direction === 'E') newV.x += distance;
              else if (oldV.direction === 'W') newV.x -= distance;
              return newV;
            }
            return v;
          });
          return { ...data, vehicles: mergedVehicles };
        });
      } catch (e) { }
    };
    return () => { if (ws.readyState === 1) ws.close(); };
  }, []);

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Canvas camera={{ position: [500, 600, 800], fov: 50, up: [0, 1, 0] }}>
          <color attach="background" args={['#0f172a']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[1000, 1500, 500]} intensity={1.2} castShadow />
          <Scene3D state={simulationState} />
          <OrbitControls target={[500, 0, 450]} maxPolarAngle={Math.PI / 2.2} />
        </Canvas>
      </div>

      {/* Left column: dashboard (top) + controls (bottom) */}
      <div className="ui-overlay" style={{ flexDirection: 'column-reverse' }}>
        <Controls />
        <Dashboard metrics={simulationState.metrics} vehicleCount={simulationState.vehicles.length} />
      </div>

      {/* Right column: collision avoidance + V2X comms panel */}
      <div className="ui-overlay-right">
        <CollisionPanel
          vehicles={simulationState.vehicles}
          trafficLights={simulationState.trafficLights}
          hazards={simulationState.hazards}
        />
      </div>
    </div>
  );
}

export default App;
