/**
 * Utilitaires pour gérer les fichiers uploadés localement
 */

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  format: 'ply' | 'drc';
  url: string; // URL blob temporaire
}

/**
 * Convertit un fichier File en URL blob utilisable par MeshLoader
 */
export function fileToBlobUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Nettoie les URLs blob pour éviter les fuites mémoire
 */
export function revokeBlobUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Détermine le format du fichier à partir de son extension
 */
export function getFileFormat(filename: string): 'ply' | 'drc' {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'ply':
      return 'ply';
    case 'drc':
      return 'drc';
    default:
      throw new Error(`Format non supporté: ${extension}`);
  }
}

/**
 * Crée un objet FileInfo à partir d'un fichier File
 */
export function createFileInfo(file: File): FileInfo {
  const format = getFileFormat(file.name);
  const url = fileToBlobUrl(file);
  
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    format,
    url
  };
}

/**
 * Nettoie toutes les URLs blob d'un tableau de FileInfo
 */
export function cleanupFileInfo(fileInfoList: FileInfo[]): void {
  fileInfoList.forEach(fileInfo => {
    revokeBlobUrl(fileInfo.url);
  });
}

/**
 * Vérifie si une URL est une URL blob locale
 */
export function isLocalUrl(url: string): boolean {
  return url.startsWith('blob:');
}

/**
 * Extrait le nom de fichier d'un chemin ou URL
 */
export function extractFilename(urlOrPath: string): string {
  if (urlOrPath.startsWith('blob:')) {
    return 'fichier_local';
  }
  
  const parts = urlOrPath.split('/');
  const filename = parts[parts.length - 1];
  return filename.replace(/\.(final\.)?ply|\.(drc)/i, '') || 'model';
}

/**
 * Extrait les coordonnées du nom de fichier (format: XXXX_YYYY)
 * @param filename - Nom du fichier contenant les coordonnées au format XXXX_YYYY
 * @returns Objet avec x et y ou null si les coordonnées ne peuvent pas être extraites
 */
export function extractCoordinates(filename: string): { x: number; y: number } | null {
  const match = filename.match(/(\d{4})_(\d{4})/);
  if (match) {
    return {
      x: parseInt(match[1], 10),
      y: parseInt(match[2], 10),
    };
  }
  return null;
}