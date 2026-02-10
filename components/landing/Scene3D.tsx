'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles({ count = 400 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8,
        ] as [number, number, number],
        speed: 0.002 + Math.random() * 0.006,
        offset: Math.random() * Math.PI * 2,
        scale: 0.015 + Math.random() * 0.035,
      });
    }
    return temp;
  }, [count]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const time = clock.getElapsedTime();
    particles.forEach((p, i) => {
      dummy.position.set(
        p.position[0] + Math.sin(time * p.speed * 60 + p.offset) * 0.3,
        p.position[1] + Math.cos(time * p.speed * 40 + p.offset) * 0.4,
        p.position[2] + Math.sin(time * p.speed * 30 + p.offset * 2) * 0.2
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#8B5CF6" transparent opacity={0.5} />
    </instancedMesh>
  );
}

function FloatingGeometry() {
  const icoRef = useRef<THREE.Mesh>(null);
  const torusRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (icoRef.current) {
      icoRef.current.rotation.x = t * 0.08;
      icoRef.current.rotation.y = t * 0.12;
      icoRef.current.position.y = Math.sin(t * 0.3) * 0.3;
    }
    if (torusRef.current) {
      torusRef.current.rotation.x = t * 0.1;
      torusRef.current.rotation.z = t * 0.06;
      torusRef.current.position.y = Math.cos(t * 0.25) * 0.25 - 0.5;
    }
  });

  return (
    <>
      <mesh ref={icoRef} position={[-3.5, 1, -2]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#7C3AED" wireframe transparent opacity={0.15} />
      </mesh>
      <mesh ref={torusRef} position={[3.5, -0.5, -3]}>
        <torusGeometry args={[0.8, 0.25, 12, 32]} />
        <meshBasicMaterial color="#C026D3" wireframe transparent opacity={0.12} />
      </mesh>
    </>
  );
}

function SceneContent() {
  return (
    <>
      <Particles count={350} />
      <FloatingGeometry />
    </>
  );
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
