import { defineStorage } from "@aws-amplify/backend";
import { updateGeoJson } from './update-geojson/resource';

export const storage = defineStorage({
  name: "amplifyAlpHDmeshes",
  access: (allow) => ({
    "meshes/*": [
      allow.guest.to(["read"]),
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.resource(updateGeoJson).to(['read', 'write', 'delete'])
    ],

  }),
  triggers: {
    onUpload: updateGeoJson
  }
});
