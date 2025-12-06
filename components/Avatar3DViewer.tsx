import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { config } from '../config';

interface AvatarModelProps {
    url: string;
}

// 3D Model Component
function Model({ url }: AvatarModelProps) {
    const { scene } = useGLTF(url);
    const modelRef = useRef<THREE.Group>(null);

    // Slow auto-rotation
    useFrame((state) => {
        if (modelRef.current) {
            modelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
        }
    });

    return (
        <group ref={modelRef}>
            <primitive
                object={scene}
                scale={2.5}
                position={[0, 0, 0]}
            />
        </group>
    );
}

// Loading Fallback
function LoadingSpinner() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.elapsedTime;
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
        }
    });

    return (
        <mesh ref={meshRef}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#06b6d4" wireframe />
        </mesh>
    );
}

// Fallback Avatar (when WebGL fails)
const FallbackAvatar: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`relative ${className} flex items-center justify-center`}>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-pink-500/20 blur-xl"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-cyan-500 to-purple-500 p-1">
                {config.avatarUrl ? (
                    <img
                        src={config.avatarUrl}
                        alt={config.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                        <span className="text-2xl font-tech font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                            {config.name.split(' ').map(n => n[0]).join('')}
                        </span>
                    </div>
                )}
            </div>
            {/* Decorative frame */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500"></div>
            </div>
        </div>
    );
};

interface Avatar3DViewerProps {
    modelUrl?: string;
    className?: string;
}

const Avatar3DViewer: React.FC<Avatar3DViewerProps> = ({
    modelUrl = '/avatar.glb',
    className = ''
}) => {
    const [hasError, setHasError] = useState(false);
    const [isWebGLAvailable, setIsWebGLAvailable] = useState(true);

    // Check WebGL availability
    useEffect(() => {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                setIsWebGLAvailable(false);
            }
        } catch {
            setIsWebGLAvailable(false);
        }
    }, []);

    // Show fallback if WebGL not available or error occurred
    if (!isWebGLAvailable || hasError) {
        return <FallbackAvatar className={className} />;
    }

    return (
        <div className={`relative ${className}`}>
            {/* Glow effect behind */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-pink-500/20 blur-xl"></div>

            {/* 3D Canvas with error handling */}
            <Canvas
                camera={{ position: [0, 0, 3], fov: 50 }}
                style={{ background: 'transparent' }}
                gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
                onCreated={() => { }}
                onError={() => setHasError(true)}
            >
                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <spotLight
                    position={[10, 10, 10]}
                    angle={0.15}
                    penumbra={1}
                    intensity={1}
                />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
                <pointLight position={[10, 5, 0]} intensity={0.3} color="#06b6d4" />

                {/* Model */}
                <Suspense fallback={<LoadingSpinner />}>
                    <Model url={modelUrl} />
                    <ContactShadows
                        position={[0, -1.5, 0]}
                        opacity={0.4}
                        scale={4}
                        blur={2}
                    />
                </Suspense>

                {/* Environment for reflections */}
                <Environment preset="city" />

                {/* Interactive controls */}
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 2}
                    autoRotate
                    autoRotateSpeed={1}
                />
            </Canvas>

            {/* Decorative frame */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500"></div>
            </div>
        </div>
    );
};

export default Avatar3DViewer;

