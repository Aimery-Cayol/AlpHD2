"use client";

import { BufferGeometry } from "three";

export class GeometryInspector {
  /**
   * Obtient des informations de performance sur une géométrie
   */
  static getPerformanceInfo(geometry: BufferGeometry) {
    const vertexCount = geometry.getAttribute('position').count;
    const indexAttribute = geometry.getIndex();
    const indexCount = indexAttribute?.count || vertexCount;
    const triangles = indexCount / 3;
    
    return {
      vertices: vertexCount,
      indices: indexCount,
      triangles: triangles,
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

export default GeometryInspector;
