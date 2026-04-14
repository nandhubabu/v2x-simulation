import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Sphere, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

export default function Scene3D({ state }) {
    const { vehicles, trafficLights, hazards, graph, aiPredictions } = state;

    return (
        <group>
            {/* Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[500, -1, 400]} receiveShadow>
                <planeGeometry args={[4000, 4000]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>

            <gridHelper args={[4000, 100, '#334155', '#0f172a']} position={[500, -0.5, 400]} />

            {/* Roads */}
            <Line points={[[-1000, 0.5, 300], [2000, 0.5, 300]]} color="#334155" lineWidth={40} />
            <Line points={[[-1000, 0.5, 600], [2000, 0.5, 600]]} color="#334155" lineWidth={40} />
            <Line points={[[400, 0.5, -1000], [400, 0.5, 2000]]} color="#334155" lineWidth={40} />
            <Line points={[[700, 0.5, -1000], [700, 0.5, 2000]]} color="#334155" lineWidth={40} />

            {/* Traffic Lights */}
            {trafficLights && trafficLights.map(tl => {
                const color = tl.state === 'green' ? '#10b981' : tl.state === 'yellow' ? '#f59e0b' : '#ef4444';
                return (
                    <group key={tl.id} position={[tl.x, 15, tl.y]}>
                        <Cylinder args={[2, 2, 30]} position={[0, -15, 0]}>
                            <meshStandardMaterial color="#475569" />
                        </Cylinder>
                        <Sphere args={[6]} position={[0, 0, 0]}>
                            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
                        </Sphere>
                    </group>
                )
            })}

            {/* Hazards */}
            {hazards && hazards.map(h => (
                <group key={h.id} position={[h.x, 2, h.y]}>
                    <Cylinder args={[25, 25, 2]} material-color="rgba(245, 158, 11, 0.4)" material-transparent position={[0, 0, 0]} />
                    <Sphere args={[8]} position={[0, 4, 0]}>
                        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2} />
                    </Sphere>
                </group>
            ))}

            {/* Vehicles */}
            {vehicles && vehicles.map(v => {
                let color = '#f8fafc';
                let emissive = '#000000';
                if (v.status === 'collision_warning') { color = '#ef4444'; emissive = '#ef4444'; }
                else if (v.status === 'slowing_hazard') { color = '#f59e0b'; }
                else if (v.type === 'emergency') { color = '#3b82f6'; emissive = '#3b82f6'; }

                let rotY = 0;
                if (v.direction === 'N') rotY = -Math.PI;
                else if (v.direction === 'S') rotY = 0;
                else if (v.direction === 'E') rotY = Math.PI / 2;
                else if (v.direction === 'W') rotY = -Math.PI / 2;

                const prediction = aiPredictions && aiPredictions[v.id];

                return (
                    <group key={v.id}>
                        <group position={[v.x, 8, v.y]} rotation={[0, rotY, 0]}>
                            <Box args={[14, 12, 28]} castShadow>
                                <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissive !== '#000000' ? 0.8 : 0} />
                            </Box>
                            <Box args={[12, 4, 2]} position={[0, -2, 14.5]}>
                                <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1} />
                            </Box>
                            {v.status === 'collision_warning' && (
                                <Sphere args={[20]} position={[0, 0, 0]} material-transparent material-opacity={0.3}>
                                    <meshBasicMaterial color="#ef4444" wireframe />
                                </Sphere>
                            )}
                        </group>

                        {/* Ghost Trajectory AI */}
                        {prediction && (
                            <Line
                                points={[[v.x, 2, v.y], [prediction.predicted_x, 2, prediction.predicted_y]]}
                                color={v.status === 'collision_warning' ? '#ef4444' : '#3b82f6'}
                                lineWidth={3}
                            />
                        )}
                    </group>
                )
            })}
        </group>
    );
}
