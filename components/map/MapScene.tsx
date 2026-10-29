"use client";

import { Canvas } from "@react-three/fiber";
import { Color } from "three";

function PlaceholderGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20, 1, 1]} />
      <meshStandardMaterial color="#1a2e1a" />
    </mesh>
  );
}

export default function MapScene() {
  return (
    <Canvas
      camera={{ position: [0, 12, 10], fov: 45, near: 0.1, far: 500 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ scene }) => {
        scene.background = new Color("#0b1210");
      }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 16, 6]} intensity={1.1} />
      <fog attach="fog" args={["#0b1210", 18, 48]} />
      <PlaceholderGround />
    </Canvas>
  );
}
