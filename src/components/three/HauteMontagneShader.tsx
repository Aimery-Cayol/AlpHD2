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
    // Couleurs pour les pentes avalancheuses
    showAvalanchePentes: false,
    avalanche0Color: new THREE.Color('#00FF00'), // 0-5° : vert fluo
    avalanche1Color: new THREE.Color('#F1E70B'), // 30-35°
    avalanche2Color: new THREE.Color('#F86F21'), // 35-40°
    avalanche3Color: new THREE.Color('#E3035B'), // 40-45°
    avalanche4Color: new THREE.Color('#CB87BA'), // 45-50°
    avalanche5Color: new THREE.Color('#120688'), // 50-55° : bleu foncé
    avalancheIntensity: 0.6,
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
    uniform bool showAvalanchePentes;
    uniform vec3 avalanche0Color; // 0-5° : vert fluo
    uniform vec3 avalanche1Color; // 30-35°
    uniform vec3 avalanche2Color; // 35-40°
    uniform vec3 avalanche3Color; // 40-45°
    uniform vec3 avalanche4Color; // 45-50°
    uniform vec3 avalanche5Color; // 50-55° : bleu foncé
    uniform float avalancheIntensity;
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

      // Coloration des pentes avalancheuses (si activée)
      if (showAvalanchePentes) {
        // Conversion de slope (cos) vers angle en degrés
        float slopeAngleDeg = acos(slope) * 180.0 / 3.14159265359;
        
        vec3 avalancheColor = vec3(0.0);
        float avalancheFactor = 0.0;
        float fadeWidth = 0.01; // Largeur de la transition en degrés
        
        // 0-5° : vert fluo (#00FF00)
        if (slopeAngleDeg >= 0.0 && slopeAngleDeg < 5.0) {
          float fadeIn = smoothstep(0.0, 0.0 + fadeWidth, slopeAngleDeg);
          float fadeOut = 1.0 - smoothstep(5.0 - fadeWidth, 5.0, slopeAngleDeg);
          avalancheColor = avalanche0Color;
          avalancheFactor = fadeIn * fadeOut * avalancheIntensity;
        }
        // 30-35° : jaune (#F1E70B)
        else if (slopeAngleDeg >= 30.0 && slopeAngleDeg < 35.0) {
          float fadeIn = smoothstep(30.0 - fadeWidth, 30.0 + fadeWidth, slopeAngleDeg);
          float fadeOut = 1.0 - smoothstep(35.0 - fadeWidth, 35.0, slopeAngleDeg);
          avalancheColor = avalanche1Color;
          avalancheFactor = fadeIn * fadeOut * avalancheIntensity;
        }
        // 35-40° : orange (#F86F21)
        else if (slopeAngleDeg >= 35.0 && slopeAngleDeg < 40.0) {
          float fadeIn = smoothstep(35.0, 35.0 + fadeWidth, slopeAngleDeg);
          float fadeOut = 1.0 - smoothstep(40.0 - fadeWidth, 40.0, slopeAngleDeg);
          avalancheColor = avalanche2Color;
          avalancheFactor = fadeIn * fadeOut * avalancheIntensity;
        }
        // 40-45° : rose foncé (#E3035B)
        else if (slopeAngleDeg >= 40.0 && slopeAngleDeg < 45.0) {
          float fadeIn = smoothstep(40.0, 40.0 + fadeWidth, slopeAngleDeg);
          float fadeOut = 1.0 - smoothstep(45.0 - fadeWidth, 45.0, slopeAngleDeg);
          avalancheColor = avalanche3Color;
          avalancheFactor = fadeIn * fadeOut * avalancheIntensity;
        }
        // 45-50° : violet (#CB87BA)
        else if (slopeAngleDeg >= 45.0 && slopeAngleDeg < 50.0) {
          float fadeIn = smoothstep(45.0, 45.0 + fadeWidth, slopeAngleDeg);
          float fadeOut = 1.0 - smoothstep(50.0 - fadeWidth, 50.0, slopeAngleDeg);
          avalancheColor = avalanche4Color;
          avalancheFactor = fadeIn * fadeOut * avalancheIntensity;
        }
        // 50-55° : bleu foncé (#120688)
        else if (slopeAngleDeg >= 50.0 && slopeAngleDeg <= 55.0) {
          float fadeIn = smoothstep(50.0, 50.0 + fadeWidth, slopeAngleDeg);
          float fadeOut = 1.0 - smoothstep(55.0 - fadeWidth, 55.0 + fadeWidth, slopeAngleDeg);
          avalancheColor = avalanche5Color;
          avalancheFactor = fadeIn * fadeOut * avalancheIntensity;
        }
        
        // Mélange de la couleur de base avec la couleur avalanche
        finalColor = mix(finalColor, avalancheColor, avalancheFactor);
      }

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