// components/SungJinWoo3D.jsx

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";

function Hunter() {
    return (
        <group>
            {/* Head */}
            <mesh position={[0, 1.8, 0]}>
                <sphereGeometry args={[0.35, 32, 32]} />
                <meshStandardMaterial color="#d1b08a" />
            </mesh>

            {/* Hair */}
            <mesh position={[0, 2.05, 0]}>
                <sphereGeometry args={[0.38, 32, 32]} />
                <meshStandardMaterial color="#050505" />
            </mesh>

            {/* Body */}
            <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[0.8, 1.8, 0.45]} />
                <meshStandardMaterial color="#111111" />
            </mesh>

            {/* Coat */}
            <mesh position={[0, 0.3, -0.08]}>
                <boxGeometry args={[1.1, 2.4, 0.15]} />
                <meshStandardMaterial
                    color="#080808"
                    emissive="#5511ff"
                    emissiveIntensity={0.25}
                />
            </mesh>

            {/* Legs */}
            <mesh position={[-0.2, -1.1, 0]}>
                <boxGeometry args={[0.22, 1.3, 0.22]} />
                <meshStandardMaterial color="#080808" />
            </mesh>

            <mesh position={[0.2, -1.1, 0]}>
                <boxGeometry args={[0.22, 1.3, 0.22]} />
                <meshStandardMaterial color="#080808" />
            </mesh>

            {/* Purple Daggers */}
            <mesh position={[-0.9, 0.3, 0]} rotation={[0, 0, -0.8]}>
                <boxGeometry args={[0.08, 1.2, 0.08]} />
                <meshStandardMaterial
                    color="#8b5cf6"
                    emissive="#8b5cf6"
                    emissiveIntensity={2}
                />
            </mesh>

            <mesh position={[0.9, 0.3, 0]} rotation={[0, 0, 0.8]}>
                <boxGeometry args={[0.08, 1.2, 0.08]} />
                <meshStandardMaterial
                    color="#8b5cf6"
                    emissive="#8b5cf6"
                    emissiveIntensity={2}
                />
            </mesh>
        </group>
    );
}

export default function SungJinWoo3D() {
    return (
        <div
            style={{
                width: 350,
                height: 500,
            }}
        >
            <Canvas camera={{ position: [0, 1, 5], fov: 40 }}>
                <ambientLight intensity={1} />

                <pointLight
                    position={[2, 4, 2]}
                    intensity={35}
                    color="#8b5cf6"
                />

                <pointLight
                    position={[-2, 4, 2]}
                    intensity={25}
                    color="#4f46e5"
                />

                <Float
                    speed={2}
                    rotationIntensity={0.3}
                    floatIntensity={0.3}
                >
                    <Hunter />
                </Float>

                <OrbitControls
                    enableZoom={false}
                    autoRotate
                    autoRotateSpeed={1.5}
                />
            </Canvas>
        </div>
    );
}