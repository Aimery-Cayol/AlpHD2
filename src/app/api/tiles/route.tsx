import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import amplifyOutputs from '../../../../amplify_outputs.json'

// Configuration S3
const createS3Client = () => {
  return new S3Client({
    region: amplifyOutputs.storage.aws_region,
  })
}

const s3Client = createS3Client()
const BUCKET_NAME = amplifyOutputs.storage.bucket_name

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    console.log('=== API Route - Récupération GeoJSON des tuiles depuis S3 ===')

    // Récupérer le fichier tiles.geojson depuis S3
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'tiles/tiles.geojson'
    })

    const response = await s3Client.send(command)

    if (!response.Body) {
      console.warn('Fichier tiles.geojson non trouvé dans S3, retour GeoJSON vide')
      return NextResponse.json({
        type: 'FeatureCollection',
        features: []
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, max-age=300' // Cache 5 minutes
        }
      })
    }

    // Convertir le stream en string
    const bodyContents = await response.Body.transformToString()
    const geoJson = JSON.parse(bodyContents)

    return NextResponse.json(geoJson, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300' // Cache 5 minutes
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération du GeoJSON:', error)
    // En cas d'erreur, retourner un GeoJSON vide au lieu d'une erreur 500
    return NextResponse.json({
      type: 'FeatureCollection',
      features: []
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300' // Cache 5 minutes
      }
    })
  }
}

// Gestion des requêtes OPTIONS pour CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}