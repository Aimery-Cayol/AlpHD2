import type { S3Handler } from "aws-lambda";
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import proj4 from "proj4";

proj4.defs(
  "EPSG:2154",
  "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
);
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs +type=crs");

const s3Client = new S3Client({});

function lambert93ToWgs84(x: number, y: number): [number, number] {
  const [lon, lat] = proj4("EPSG:2154", "EPSG:4326", [x, y]);
  return [lon, lat];
}

export const handler: S3Handler = async (event) => {
  // Vérifier si l'événement contient des records
  if (!event.Records || event.Records.length === 0) {
    console.error('Aucun record trouvé dans l\'événement');
    return;
  }

  const bucketName = event.Records[0].s3.bucket.name;
  const region = process.env.AWS_REGION;

  // Vérifier si l'événement concerne le fichier tiles.geojson pour éviter les boucles infinies
  const objectKey = event.Records[0].s3.object.key;
  if (objectKey === 'tiles/tiles.geojson') {
    console.log('Événement Ignoré: Mise à jour du fichier tiles/tiles.geojson détectée, Ignorée pour éviter une boucle infinie');
    return;
  }

  // Lister tous les meshes
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: "meshes/",
  });

  const response = await s3Client.send(listCommand);

  // Grouper les fichiers par coordonnées (x, y)
  const tilesByCoords: Record<
    string,
    { x: number; y: number; files: { url: string; level: string; format: string }[] }
  > = {};

  (response.Contents || [])
    .filter(
      (obj) => obj.Key?.endsWith(".drc")
    )
    .forEach((obj) => {
      const key = obj.Key!;
      const match = key.match(/(\d{4})_(\d{4})_(\d+)\.drc$/);
      if (!match) {
        console.warn(`⚠️ Fichier ignoré (format invalide) : ${key}`);
        return;
      }

      const xCoord = match[1]; // Garder en string pour l'ID
      const yCoord = match[2]; // Garder en string pour l'ID
      const x = parseInt(match[1]) * 1000; // Pour les calculs géographiques
      const y = parseInt(match[2]) * 1000; // Pour les calculs géographiques
      const level = match[3];
      const format = "drc";
      const coordKey = `${xCoord}_${yCoord}`; // ID avec les coordonnées du fichier

      if (!tilesByCoords[coordKey]) {
        tilesByCoords[coordKey] = { x, y, files: [] };
      }

      tilesByCoords[coordKey].files.push({
        url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
        level,
        format,
      });
    });

  // Créer les features avec tous les niveaux disponibles
  const features = Object.entries(tilesByCoords).map(
    ([coordKey, { x, y, files }]) => {
      const nw = lambert93ToWgs84(x, y);
      const ne = lambert93ToWgs84(x + 1000, y);
      const se = lambert93ToWgs84(x + 1000, y - 1000);
      const sw = lambert93ToWgs84(x, y - 1000);

      // Extraire les niveaux disponibles et les trier
      const levels = [...new Set(files.map((f) => f.level))].sort(
        (a, b) => parseInt(a) - parseInt(b)
      );

      // URL par défaut (niveau le plus bas)
      const defaultFile = files.find((f) => f.level === levels[0]) || files[0];

      return {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[sw, nw, ne, se, sw]],
        },
        properties: {
          id: coordKey,
          x,
          y,
          url: defaultFile.url, // URL par défaut pour compatibilité
          format: defaultFile.format,
          name: coordKey,
          levels, // Liste des niveaux disponibles
          files, // Tous les fichiers avec leurs URLs et niveaux
        },
      };
    }
  );

  const geoJson = {
    type: "FeatureCollection",
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:EPSG::4326",
      },
    },
    features,
  };

  // Sauvegarder dans S3
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: "tiles/tiles.geojson",
      Body: JSON.stringify(geoJson, null, 2),
      ContentType: "application/json",
    })
  );

  console.log(`✅ GeoJSON mis à jour avec ${features.length} tuiles`);
};
