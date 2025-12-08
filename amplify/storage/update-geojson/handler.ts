import type { S3Handler } from 'aws-lambda';
import { S3Client, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import proj4 from 'proj4';

proj4.defs('EPSG:2154', '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs +type=crs');

const s3Client = new S3Client({});

function lambert93ToWgs84(x: number, y: number): [number, number] {
  const [lon, lat] = proj4('EPSG:2154', 'EPSG:4326', [x, y]);
  return [lon, lat];
}

export const handler: S3Handler = async (event) => {
  const bucketName = event.Records[0].s3.bucket.name;
  const region = process.env.AWS_REGION;

  // Lister tous les meshes
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: 'meshes/'
  });

  const response = await s3Client.send(listCommand);
  
  const features = (response.Contents || [])
    .filter(obj => obj.Key?.endsWith('.final.ply') || obj.Key?.endsWith('.drc'))
    .map(obj => {
      const key = obj.Key!;
      const match = key.match(/(\d{4})_(\d{4})/);
      if (!match) {
        console.warn(`⚠️ Fichier ignoré (pas de coordonnées) : ${key}`);
        return null;}

      const x = parseInt(match[1]) * 1000;
      const y = parseInt(match[2]) * 1000;

      const nw = lambert93ToWgs84(x, y);
      const ne = lambert93ToWgs84(x + 1000, y);
      const se = lambert93ToWgs84(x + 1000, y - 1000);
      const sw = lambert93ToWgs84(x, y - 1000);

      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[sw, nw, ne, se, sw]]
        },
        properties: {
          id: `${x}_${y}`,
          x, y,
          url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
          format: key.endsWith('.drc') ? 'drc' : 'ply',
          name: key.split('/').pop()?.replace(/\.(final\.)?ply|\.drc/, '') || ''
        }
      };
    })
    .filter(Boolean);

  const geoJson = {
    type: 'FeatureCollection',
    features
  };

  // Sauvegarder dans S3
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'tiles.geojson',
    Body: JSON.stringify(geoJson, null, 2),
    ContentType: 'application/json'
  }));

  console.log(`✅ GeoJSON mis à jour avec ${features.length} tuiles`);
};