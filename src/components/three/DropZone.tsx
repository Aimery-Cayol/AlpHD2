"use client";

import React, { useCallback, useState } from "react";
import { FaUpload, FaFile, FaExclamationCircle } from "react-icons/fa";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string[];
}

export default function DropZone({ onFileSelect, acceptedFormats }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
      setError("Aucun fichier détecté");
      return;
    }

    const file = files[0];
    
    // Vérifier le format du fichier
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!acceptedFormats.includes(fileExtension || '')) {
      setError(`Format non supporté. Formats acceptés: ${acceptedFormats.join(', ')}`);
      return;
    }

    // Vérifier la taille du fichier (limite à 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError("Le fichier est trop volumineux. Taille maximale: 100MB");
      return;
    }

    onFileSelect(file);
  }, [onFileSelect, acceptedFormats]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le format du fichier
      const fileExtension = file.name.toLowerCase().split('.').pop();
      if (!acceptedFormats.includes(fileExtension || '')) {
        setError(`Format non supporté. Formats acceptés: ${acceptedFormats.join(', ')}`);
        return;
      }

      // Vérifier la taille du fichier
      if (file.size > 100 * 1024 * 1024) {
        setError("Le fichier est trop volumineux. Taille maximale: 100MB");
        return;
      }

      onFileSelect(file);
    }
  }, [onFileSelect, acceptedFormats]);

  const getAcceptedFormatsText = () => {
    return acceptedFormats.map(format => `.${format.toUpperCase()}`).join(', ');
  };

  return (
    <div className="relative w-full h-full">
      {/* Zone de drop */}
      <div
        className={`
          absolute inset-0 flex flex-col items-center justify-center 
          border-2 border-dashed rounded-lg transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4 p-8 text-center">
          {/* Icône */}
          <div className={`
            p-4 rounded-full transition-colors duration-200
            ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}
            ${error ? 'bg-red-100' : ''}
          `}>
            {error ? (
              <FaExclamationCircle className="w-8 h-8 text-red-500" />
            ) : isDragOver ? (
              <FaFile className="w-8 h-8 text-blue-500" />
            ) : (
              <FaUpload className="w-8 h-8 text-gray-500" />
            )}
          </div>

          {/* Texte principal */}
          <div className="space-y-2">
            <h3 className={`
              text-lg font-medium
              ${error ? 'text-red-700' : 'text-gray-700'}
              ${isDragOver ? 'text-blue-700' : ''}
            `}>
              {error 
                ? 'Erreur de fichier' 
                : isDragOver 
                  ? 'Déposez votre fichier ici'
                  : 'Glissez-déposez un fichier ou cliquez pour parcourir'
              }
            </h3>
            
            {!error && (
              <p className="text-sm text-gray-500">
                Formats supportés: {getAcceptedFormatsText()}
              </p>
            )}
            
            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          {/* Bouton de sélection */}
          <label className={`
            px-6 py-3 rounded-lg font-medium transition-colors duration-200
            cursor-pointer
            ${isDragOver 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : error
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }
          `}>
            <span>Parcourir les fichiers</span>
            <input
              type="file"
              className="hidden"
              accept={acceptedFormats.map(format => `.${format}`).join(',')}
              onChange={handleFileInputChange}
            />
          </label>
        </div>
      </div>

      {/* Overlay quand un fichier est en cours de traitement */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-50 rounded-lg flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm font-medium text-blue-700">Traitement en cours...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}