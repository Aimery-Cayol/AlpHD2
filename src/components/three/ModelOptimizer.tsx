"use client";

import { BufferGeometry, Mesh } from "three";
import * as THREE from "three";

// Seuils pour la décimation automatique
const MAX_INDICES = 25000000; // 25M indices (80% du max WebGL)
const WARNING_THRESHOLD = 30000000; // 30M indices (warning)

// Interface pour les résultats d'optimisation
interface OptimizationResult {
  optimized: boolean;
  originalTriangles: number;
  optimizedTriangles: number;
  reason: string;
}

export class ModelOptimizer {
  /**
   * Vérifie si une géométrie nécessite une optimisation
   */
  static checkOptimization(geometry: BufferGeometry): OptimizationResult {
    const indexAttribute = geometry.getIndex();
    const vertexCount = geometry.getAttribute('position').count;
    
    if (!indexAttribute) {
      // Pas d'index, utiliser le nombre de vertices
      const triangles = vertexCount / 3;
      return {
        optimized: false,
        originalTriangles: triangles,
        optimizedTriangles: triangles,
        reason: 'No index buffer'
      };
    }

    const totalIndices = indexAttribute.count;
    const triangles = totalIndices / 3;

    if (totalIndices > WARNING_THRESHOLD) {
      return {
        optimized: true,
        originalTriangles: triangles,
        optimizedTriangles: triangles,
        reason: `Too many indices (${totalIndices.toLocaleString()})`
      };
    }

    return {
      optimized: false,
      originalTriangles: triangles,
      optimizedTriangles: triangles,
      reason: 'Within limits'
    };
  }

  /**
   * Décime une géométrie pour réduire le nombre de triangles
   */
  static decimateGeometry(geometry: BufferGeometry, targetTriangles?: number): BufferGeometry {
    const indexAttribute = geometry.getIndex();
    if (!indexAttribute) {
      // Pour les géométries sans index, on peut simplement réduire les vertices
      console.warn('Geometry without index, skipping decimation');
      return geometry;
    }

    const originalIndices = indexAttribute.array;
    const originalCount = indexAttribute.count;
    
    // Calculer le nombre de triangles cible
    let targetCount: number;
    if (targetTriangles) {
      targetCount = targetTriangles * 3;
    } else {
      // Réduire à 80% du max
      targetCount = Math.min(originalCount * 0.8, MAX_INDICES);
    }

    // Stratégie simple : échantillonnage uniforme des indices
    const samplingRate = targetCount / originalCount;
    const sampledLength = Math.floor(originalCount * samplingRate);
    
    // Créer le bon type d'array selon le type original
    let sampledIndices: Uint16Array | Uint32Array;
    if (originalIndices instanceof Uint32Array) {
      sampledIndices = new Uint32Array(sampledLength);
    } else {
      sampledIndices = new Uint16Array(sampledLength);
    }
    
    for (let i = 0; i < sampledIndices.length; i += 3) {
      const sourceIndex = Math.floor((i / sampledIndices.length) * originalCount) * 3;
      
      if (sourceIndex + 2 < originalCount) {
        sampledIndices[i] = originalIndices[sourceIndex];
        sampledIndices[i + 1] = originalIndices[sourceIndex + 1];
        sampledIndices[i + 2] = originalIndices[sourceIndex + 2];
      }
    }

    // Créer une nouvelle géométrie avec les indices échantillonnés
    const optimizedGeometry = geometry.clone();
    optimizedGeometry.setIndex(new THREE.BufferAttribute(sampledIndices, 1));
    optimizedGeometry.computeVertexNormals();

    console.log(`Geometry decimated: ${originalCount} → ${sampledIndices.length} indices`);
    console.log(`Triangles: ${originalCount / 3} → ${sampledIndices.length / 3}`);

    return optimizedGeometry;
  }

  /**
   * Optimise automatiquement une géométrie si nécessaire
   */
  static optimizeIfNeeded(geometry: BufferGeometry): BufferGeometry {
    const checkResult = this.checkOptimization(geometry);
    
    if (checkResult.optimized) {
      console.warn('Large geometry detected, attempting optimization');
      console.warn(`Reason: ${checkResult.reason}`);
      console.warn(`Original triangles: ${checkResult.originalTriangles.toLocaleString()}`);
      
      /* DECIMATION DÉSACTIVÉE POUR LA PRODUCTION
      try {
        const optimizedGeometry = this.decimateGeometry(geometry);
        const newCheck = this.checkOptimization(optimizedGeometry);
        
        if (!newCheck.optimized) {
          console.log('✅ Geometry successfully optimized');
          return optimizedGeometry;
        } else {
          console.warn('⚠️  Optimization insufficient, keeping original geometry');
          return geometry;
        }
      } catch (error) {
        console.error('Error during geometry optimization:', error);
        return geometry; // Retourner l'original en cas d'erreur
      }
      */
    }
    

    return geometry;
  }

  /**
   * Obtient des informations de performance sur une géométrie
   */
  static getPerformanceInfo(geometry: BufferGeometry) {
    const check = this.checkOptimization(geometry);
    const vertexCount = geometry.getAttribute('position').count;
    const indexCount = geometry.getIndex()?.count || vertexCount;
    
    return {
      vertices: vertexCount,
      indices: indexCount,
      triangles: check.originalTriangles,
      needsOptimization: check.optimized,
      reason: check.reason,
      memoryUsage: this.estimateMemoryUsage(geometry)
    };
  }

  /**
   * Estime l'utilisation mémoire d'une géométrie (approximatif)
   */
  private static estimateMemoryUsage(geometry: BufferGeometry): number {
    let bytes = 0;
    
    Object.values(geometry.attributes).forEach(attribute => {
      bytes += attribute.array.byteLength;
    });
    
    if (geometry.getIndex()) {
      bytes += geometry.getIndex()!.array.byteLength;
    }
    
    return bytes;
  }
}

export default ModelOptimizer;
