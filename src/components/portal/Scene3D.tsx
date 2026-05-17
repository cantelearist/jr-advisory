'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ── Glossy black geometric shapes floating in the void ── */

function GlossyShape({ 
  position, 
  geometry, 
  scale = 1, 
  rotationSpeed = 0.002,
  floatSpeed = 1,
  floatIntensity = 1,
}: {
  position: [number, number, number];
  geometry: 'torus' | 'icosahedron' | 'octahedron' | 'torusKnot' | 'ring';
  scale?: number;
  rotationSpeed?: number;
  floatSpeed?: number;
  floatIntensity?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotationSpeed * delta * 60;
      meshRef.current.rotation.y += rotationSpeed * 0.7 * delta * 60;
    }
  });

  const geo = useMemo(() => {
    switch (geometry) {
      case 'torus':
        return <torusGeometry args={[1, 0.35, 32, 64]} />;
      case 'icosahedron':
        return <icosahedronGeometry args={[1, 0]} />;
      case 'octahedron':
        return <octahedronGeometry args={[1, 0]} />;
      case 'torusKnot':
        return <torusKnotGeometry args={[0.8, 0.25, 128, 32]} />;
      case 'ring':
        return <torusGeometry args={[1.2, 0.08, 16, 64]} />;
      default:
        return <icosahedronGeometry args={[1, 0]} />;
    }
  }, [geometry]);

  return (
    <Float speed={floatSpeed} rotationIntensity={0.3} floatIntensity={floatIntensity}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {geo}
        <meshPhysicalMaterial
          color="#080808"
          metalness={0.95}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={0.6}
          reflectivity={1}
        />
      </mesh>
    </Float>
  );
}

/* ── Floating particles ── */
function Particles({ count = 80 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 15,
        ],
        speed: Math.random() * 0.005 + 0.001,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, [count]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const time = clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    
    particles.forEach((p, i) => {
      dummy.position.set(
        p.position[0] + Math.sin(time * p.speed * 60 + p.offset) * 0.5,
        p.position[1] + Math.cos(time * p.speed * 40 + p.offset) * 0.3,
        p.position[2]
      );
      dummy.scale.setScalar(0.015 + Math.sin(time + p.offset) * 0.008);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#c9a96e" transparent opacity={0.4} />
    </instancedMesh>
  );
}

/* ── Ambient light rays ── */
function LightRays() {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  return (
    <mesh ref={ref} position={[0, 0, -5]}>
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial
        color="#0a0a0a"
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}

/* ── Main 3D Scene ── */
export default function Scene3D({ 
  variant = 'login',
  className = '',
}: { 
  variant?: 'login' | 'dashboard' | 'vault' | 'minimal';
  className?: string;
}) {
  const shapes = useMemo(() => {
    switch (variant) {
      case 'login':
        return [
          { position: [-4, 2, -3] as [number, number, number], geometry: 'torus' as const, scale: 1.8, rotationSpeed: 0.001 },
          { position: [4.5, -1.5, -4] as [number, number, number], geometry: 'icosahedron' as const, scale: 1.4, rotationSpeed: 0.0015 },
          { position: [-2, -3, -5] as [number, number, number], geometry: 'octahedron' as const, scale: 1.2, rotationSpeed: 0.002 },
          { position: [3, 3, -6] as [number, number, number], geometry: 'torusKnot' as const, scale: 0.9, rotationSpeed: 0.001 },
          { position: [0, -1, -8] as [number, number, number], geometry: 'ring' as const, scale: 2.5, rotationSpeed: 0.0008 },
          { position: [-5, -2, -7] as [number, number, number], geometry: 'torus' as const, scale: 1.1, rotationSpeed: 0.0012 },
          { position: [6, 1, -9] as [number, number, number], geometry: 'icosahedron' as const, scale: 1.6, rotationSpeed: 0.001 },
        ];
      case 'dashboard':
        return [
          { position: [6, 3, -5] as [number, number, number], geometry: 'torus' as const, scale: 2.2, rotationSpeed: 0.0008 },
          { position: [-6, -2, -7] as [number, number, number], geometry: 'octahedron' as const, scale: 1.5, rotationSpeed: 0.001 },
          { position: [3, -4, -9] as [number, number, number], geometry: 'ring' as const, scale: 1.8, rotationSpeed: 0.0006 },
        ];
      case 'vault':
        return [
          { position: [5, 0, -6] as [number, number, number], geometry: 'icosahedron' as const, scale: 1.8, rotationSpeed: 0.001 },
          { position: [-4, -3, -8] as [number, number, number], geometry: 'torusKnot' as const, scale: 1.0, rotationSpeed: 0.0008 },
        ];
      default:
        return [
          { position: [5, 2, -6] as [number, number, number], geometry: 'torus' as const, scale: 1.5, rotationSpeed: 0.001 },
        ];
    }
  }, [variant]);

  return (
    <div className={`absolute inset-0 ${className}`} style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 5, 5]} intensity={0.4} color="#ffffff" />
        <directionalLight position={[-5, -3, 3]} intensity={0.2} color="#c9a96e" />
        <pointLight position={[0, 0, 4]} intensity={0.3} color="#e8d5b0" />
        
        <Environment preset="night" />
        
        {shapes.map((shape, i) => (
          <GlossyShape key={i} {...shape} />
        ))}
        
        <Particles count={variant === 'login' ? 100 : 40} />
        <LightRays />
      </Canvas>
    </div>
  );
}
