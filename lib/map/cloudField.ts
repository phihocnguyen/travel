// Shared broad cloud masses for the volume and its soft ground shadow.
export const CLOUD_FIELD_GLSL = /* glsl */ `
  float cloudBanks(vec2 uv, float time) {
    vec2 drift = vec2(sin(time * 0.008) * 0.04, sin(time * 0.006) * 0.025);
    vec2 xz = uv - drift;
    float banks = exp(-dot((xz - vec2(0.27, 0.30)) / vec2(0.15, 0.12), (xz - vec2(0.27, 0.30)) / vec2(0.15, 0.12)))
                + exp(-dot((xz - vec2(0.76, 0.36)) / vec2(0.14, 0.18), (xz - vec2(0.76, 0.36)) / vec2(0.14, 0.18)))
                + exp(-dot((xz - vec2(0.43, 0.78)) / vec2(0.23, 0.10), (xz - vec2(0.43, 0.78)) / vec2(0.23, 0.10)));
    return smoothstep(0.12, 0.7, banks);
  }
`;
