#!/usr/bin/env tsx

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import amplifyOutputs from '../../amplify_outputs.json'
import proj4 from 'proj4'
import * as fs from 'fs'
import * as path from 'path'

// Définir les projections
proj4.defs('EPSG:2154', '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs +type=crs');

// Configuration S3
const createS3Client = () => {
  return new S3Client({
    region: amplifyOutputs.storage.aws_region,
  })
}

const s3Client = createS3Client()
const BUCKET_NAME = amplifyOutputs.storage.bucket_name

// Fonction pour convertir Lambert 93 vers WGS84
function lambert93ToWgs84(x: number, y: number): [number, number] {
  const [lon, lat] = proj4('EPSG:2154', 'EPSG:4326', [x, y])
  return [lon, lat]
}

async function generateGeoJSON() {
  console.log('=== Génération du GeoJSON des tuiles ===')

  try {
    // Lister les objets dans le bucket S3
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'meshes/'
    })

    const response = await s3Client.send(command)

    if (!response.Contents) {
      console.log('Aucun fichier trouvé')
      return
    }

    console.log(`Trouvé ${response.Contents.length} objets dans le bucket`)

    // Filtrer et traiter les fichiers .ply et .drc
    const features = response.Contents
      .filter((object) => {
        const key = object.Key || ''
        return key.endsWith('.final.ply') || key.endsWith('.drc')
      })
      .map((object) => {
        const key = object.Key || ''
        const url = `https://${BUCKET_NAME}.s3.${amplifyOutputs.storage.aws_region}.amazonaws.com/${key}`

        // Extraire les coordonnées XXXX_YYYY du nom de fichier
        const match = key.match(/(\d{4})_(\d{4})/)
        if (!match) {
          console.warn(`Coordonnées non trouvées pour ${key}`)
          return null
        }

        const x = parseInt(match[1], 10) * 1000
        const y = parseInt(match[2], 10) * 1000

        console.log(`Traitement de la tuile ${x}_${y}`)

        // Calculer les coins de la tuile en Lambert 93
        // NW (nord-ouest) : (x, y)
        // NE (nord-est) : (x + 1000, y)
        // SE (sud-est) : (x + 1000, y - 1000)
        // SW (sud-ouest) : (x, y - 1000)

        const nw = lambert93ToWgs84(x, y)
        const ne = lambert93ToWgs84(x + 1000, y)
        const se = lambert93ToWgs84(x + 1000, y - 1000)
        const sw = lambert93ToWgs84(x, y - 1000)

        // Créer le polygone GeoJSON (fermé)
        const coordinates = [[
          sw,  // sud-ouest
          nw,  // nord-ouest
          ne,  // nord-est
          se,  // sud-est
          sw   // fermer le polygone
        ]]

        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coordinates
          },
          properties: {
            id: `${x}_${y}`,
            x: x,
            y: y,
            url: url,
            format: key.endsWith('.drc') ? 'drc' : 'ply',
            name: key.split('/').pop()?.replace(/\.(final\.)?ply|\.drc/, '') || ''
          }
        }
      })
      .filter(Boolean)

    const geoJson = {
      type: 'FeatureCollection',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::4326'
        }
      },
      features: features
    }

    // Créer le dossier public s'il n'existe pas
    const outputDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Écrire le fichier GeoJSON
    const outputPath = path.join(outputDir, 'tiles.geojson')
    fs.writeFileSync(outputPath, JSON.stringify(geoJson, null, 2))

    console.log(`✅ GeoJSON généré avec ${features.length} tuiles`)
    console.log(`📁 Fichier sauvegardé : ${outputPath}`)

  } catch (error) {
    console.error('Erreur lors de la génération du GeoJSON:', error)
    process.exit(1)
  }
}

// Exécuter le script
generateGeoJSON()