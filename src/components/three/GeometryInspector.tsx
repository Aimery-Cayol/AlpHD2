"use client";

import { BufferGeometry } from "three";

export class GeometryInspector {
  /**
   * Obtient des informations de performance sur une géométrie
   */
  static getPerformanceInfo(geometry: BufferGeometry) {
    const positionAttribute = geometry.getAttribute("position");
    if (!positionAttribute) {
      return {
        vertices: 0,
        indices: 0,
        triangles: 0,
        memoryUsage: 0,
        indexed: false,
      };
    }

    const vertexCount = positionAttribute.count;
    const indexAttribute = geometry.getIndex();
    const indexed = indexAttribute !== null;

    // Si indexé : triangles = indices / 3
    // Si non-indexé : triangles = vertices / 3
    let triangles: number;
    let indexCount: number;

    if (indexed) {
      indexCount = indexAttribute!.count;
      triangles = indexCount / 3;
    } else {
      indexCount = 0;
      triangles = vertexCount / 3;
    }

    return {
      vertices: vertexCount,
      indices: indexCount,
      triangles: triangles,
      memoryUsage: this.estimateMemoryUsage(geometry),
      indexed: indexed,
    };
  }

  /**
   * Estime l'utilisation mémoire d'une géométrie (approximatif)
   */
  private static estimateMemoryUsage(geometry: BufferGeometry): number {
    let bytes = 0;

    Object.values(geometry.attributes).forEach((attribute) => {
      bytes += attribute.array.byteLength;
    });

    if (geometry.getIndex()) {
      bytes += geometry.getIndex()!.array.byteLength;
    }

    return bytes;
  }
}

export default GeometryInspector;
