"use client";

import { BufferGeometry } from "three";

interface CacheEntry {
  geometry: BufferGeometry;
  timestamp: number;
  size: number; // Taille approximative en octets
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  maxSize: number;
  hitRate: number;
}

class GeometryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number = 2000 * 1024 * 1024; // 2GB par défaut
  private maxEntries: number = 100;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize?: number, maxEntries?: number) {
    if (maxSize) this.maxSize = maxSize;
    if (maxEntries) this.maxEntries = maxEntries;
  }

  // Générer une clé unique basée sur l'URL
  private generateKey(url: string): string {
    // Utiliser une fonction de hash simple pour éviter les collisions
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32 bits
    }
    return `geometry_${Math.abs(hash).toString(36)}_${url.length}`;
  }

  // Calculer la taille approximative d'une géométrie
  private calculateSize(geometry: BufferGeometry): number {
    let size = 0;

    // Taille des attributs de géométrie
    Object.values(geometry.attributes).forEach(attribute => {
      size += attribute.array.byteLength;
    });

    // Taille de l'index buffer si présent
    if (geometry.index) {
      size += geometry.index.array.byteLength;
    }

    // Taille des groupes (très petite)
    if (geometry.groups) {
      size += geometry.groups.length * 16; // Taille approximative par groupe
    }

    return size;
  }

  // Obtenir une géométrie du cache
  get(url: string): BufferGeometry | null {
    const key = this.generateKey(url);
    const entry = this.cache.get(key);

    if (entry) {
      this.hits++;
      // Mettre à jour le timestamp d'accès
      entry.timestamp = Date.now();
      // Retourner la géométrie directement (pas de clone pour éviter les fuites mémoire)
      return entry.geometry;
    }

    this.misses++;
    return null;
  }

  // Stocker une géométrie dans le cache
  set(url: string, geometry: BufferGeometry): void {
    const key = this.generateKey(url);
    const size = this.calculateSize(geometry);

    // Vérifier si on dépasse la taille maximale
    if (size > this.maxSize * 0.5) { // Si la géométrie est > 50% du cache max
      console.warn(`Géométrie trop volumineuse pour le cache: ${size} octets`);
      return;
    }

    // Nettoyer le cache si nécessaire
    this.evictIfNeeded(size);

    // Créer une copie de la géométrie pour éviter les références partagées
    const geometryClone = geometry.clone();

    const entry: CacheEntry = {
      geometry: geometryClone,
      timestamp: Date.now(),
      size
    };

    this.cache.set(key, entry);
  }

  // Vérifier si une géométrie est en cache
  has(url: string): boolean {
    const key = this.generateKey(url);
    return this.cache.has(key);
  }

  // Nettoyer les entrées les plus anciennes si nécessaire
  private evictIfNeeded(newEntrySize: number): void {
    let currentSize = this.getTotalSize();

    // Si on va dépasser la taille maximale après ajout
    if (currentSize + newEntrySize > this.maxSize) {
      this.evictLRU();
    }

    // Si on dépasse le nombre maximum d'entrées
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }
  }

  // Évincer les entrées les moins récemment utilisées (LRU)
  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // Trier par timestamp d'accès (les plus anciens en premier)
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Supprimer les entrées les plus anciennes jusqu'à ce qu'on ait de la place
    const targetSize = Math.floor(this.maxSize * 0.8); // Cibler 80% de la taille max
    let currentSize = this.getTotalSize();

    for (const [key, entry] of entries) {
      if (currentSize <= targetSize) break;

      this.cache.delete(key);
      currentSize -= entry.size;
    }
  }

  // Obtenir la taille totale du cache
  private getTotalSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  // Obtenir les statistiques du cache
  getStats(): CacheStats {
    const totalSize = this.getTotalSize();
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    return {
      totalEntries: this.cache.size,
      totalSize,
      maxSize: this.maxSize,
      hitRate
    };
  }

  // Vider complètement le cache
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  // Obtenir la liste des URLs en cache (pour debug)
  getCachedUrls(): string[] {
    return Array.from(this.cache.keys()).map(key =>
      key.replace('geometry_', '')
    );
  }

  // Fonction de débogage pour inspecter le cache
  debugCache(): void {
    console.log('=== DEBUG CACHE ===');
    console.log(`Total entries: ${this.cache.size}`);
    console.log(`Total size: ${this.getTotalSize()} bytes`);
    console.log('Cached URLs:');
    this.cache.forEach((entry, key) => {
      const url = key.replace('geometry_', '');
      console.log(`  ${key}: ${url} (${entry.size} bytes)`);
    });
    console.log('==================');
  }
}

// Instance globale du cache
export const geometryCache = new GeometryCache();

export default GeometryCache;
export type { CacheEntry, CacheStats };