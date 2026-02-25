import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
// Définir les constantes en premier
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";
const AWS_REGION = process.env.AWS_REGION || "eu-west-3";

// Configuration S3
const createS3Client = () => {
  return new S3Client({
    region: AWS_REGION,
    followRegionRedirects: true,
    credentials: process.env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
      : undefined,
  });
};

const s3Client = createS3Client();

export async function GET(request: NextRequest) {
  // Proxy pour un fichier DRC individuel : /api/tiles?path=meshes/1006_6545_11.drc
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");
  if (filePath) {
    try {
      const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: filePath });
      const response = await s3Client.send(command);
      if (!response.Body) return new NextResponse(null, { status: 404 });
      const buffer = await response.Body.transformToByteArray();
      return new NextResponse(Buffer.from(buffer), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch (error) {
      console.error("Erreur proxy DRC:", error);
      return new NextResponse(null, { status: 404 });
    }
  }

  try {
    console.log(
      "=== API Route - Récupération GeoJSON des tuiles depuis S3 ==="
    );

    // Récupérer le fichier tiles.geojson depuis S3
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: "tiles/tiles.geojson",
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      console.warn(
        "Fichier tiles.geojson non trouvé dans S3, retour GeoJSON vide"
      );
      return NextResponse.json(
        {
          type: "FeatureCollection",
          features: [],
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Cache-Control": "public, max-age=300", // Cache 5 minutes
          },
        }
      );
    }

    // Convertir le stream en string
    const bodyContents = await response.Body.transformToString();
    const geoJson = JSON.parse(bodyContents);

    return NextResponse.json(geoJson, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=300", // Cache 5 minutes
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du GeoJSON:", error);
    // En cas d'erreur, retourner un GeoJSON vide au lieu d'une erreur 500
    return NextResponse.json(
      {
        type: "FeatureCollection",
        features: [],
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, max-age=300", // Cache 5 minutes
        },
      }
    );
  }
}

// Gestion des requêtes OPTIONS pour CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
