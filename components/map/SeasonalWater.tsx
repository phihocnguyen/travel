"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, DoubleSide, ShaderMaterial } from "three";
import type { MapAssets } from "@/lib/map/assets";
import { useMapUI } from "./MapUIContext";

const vertex = /* glsl */ `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment = /* glsl */ `
  uniform sampler2D uMask;
  uniform float uTime;
  varying vec2 vUv;
  void main(){
    if (texture2D(uMask, vUv).g < 0.45) discard;
    vec2 p=vUv * vec2(110.0,85.0);
    float ripples=sin(p.x+uTime*0.8)*sin(p.y-uTime*0.55);
    float glint=pow(max(0.0,sin(p.x*0.65+p.y*0.4+uTime)),16.0);
    vec3 c=mix(vec3(0.08,0.32,0.37),vec3(0.24,0.62,0.66),ripples*0.5+0.5);
    gl_FragColor=vec4(c+glint*0.16,0.12);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function SeasonalWater({ assets, y }: { assets: MapAssets; y: number }) {
  const { season } = useMapUI();
  const material = useMemo(() => new ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms: { uTime: { value: 0 }, uMask: { value: assets.mask } }, transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending }), [assets.mask]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state) => { material.uniforms.uTime.value = state.clock.elapsedTime; });
  // The water plane intentionally uses the terrain depth buffer, but it is not
  // a hydrological flood simulation. This is an artistic seasonal atmosphere.
  if (season !== "flood") return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} material={material} raycast={() => null}>
      <planeGeometry args={[assets.projector.widthKm * 0.96, assets.projector.depthKm * 0.96]} />
    </mesh>
  );
}
