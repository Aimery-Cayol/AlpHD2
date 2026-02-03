import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';


const HauteMontagne = shaderMaterial(
  {
    snowColor: new THREE.Color('#ffffff'),
    rockColor: new THREE.Color('#404040'),
    slopeThreshold: 0.7,
    smoothness: 0.2,
    lightDirection: new THREE.Vector3(1, 1, 1).normalize(),
    ambientIntensity: 0.3,
    directionalIntensity: 1.2,
    fogColor: new THREE.Color('#cddeea'), //old : #c5c5c5
    fogDensity: 0.04, //old : 0.2
    fogExponent: 6.5, //old : 1.0
  },
  // Vertex Shader
  `
    uniform vec3 lightDirection;

    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewNormal;
    varying vec3 vLightDirection;
    varying float vDepth;

    void main() {
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vViewNormal = normalize((modelViewMatrix * vec4(normal, 0.0)).xyz);
      vLightDirection = normalize((viewMatrix * vec4(lightDirection, 0.0)).xyz);
      vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
      vDepth = -viewPosition.z;
      gl_Position = projectionMatrix * viewPosition;
    }
  `,
  // Fragment Shader
  `
    uniform vec3 snowColor;
    uniform vec3 rockColor;
    uniform float slopeThreshold;
    uniform float smoothness;
    uniform vec3 lightDirection;
    uniform float ambientIntensity;
    uniform float directionalIntensity;
    uniform vec3 fogColor;
    uniform float fogDensity;
    uniform float fogExponent;

    varying vec3 vWorldNormal;
    varying vec3 vViewNormal;
    varying vec3 vLightDirection;
    varying float vDepth;

    void main() {
      float slope = abs(dot(vWorldNormal, vec3(0.0, 1.0, 0.0)));

      float mix_factor = smoothstep(
        slopeThreshold - smoothness,
        slopeThreshold + smoothness,
        slope
      );

      vec3 baseColor = mix(rockColor, snowColor, mix_factor);

      // Calcul de l'éclairage diffus en view space
      float diffuse = max(0.0, dot(normalize(vViewNormal), normalize(vLightDirection)));
      float intensity = ambientIntensity + directionalIntensity * diffuse;

      vec3 finalColor = baseColor * intensity;

      // Effet de brume de profondeur
      float fogFactor = 1.0 - exp(-fogExponent * fogDensity * vDepth);
      finalColor = mix(finalColor, fogColor, fogFactor);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// Extension pour React Three Fiber
extend({ SlopeMaterialImpl: HauteMontagne });

// // Déclaration TypeScript pour JSX
// declare module '@react-three/fiber' {
//   interface ThreeElements {
//     slopeMaterialImpl: any;
//   }
// }

export default HauteMontagne;