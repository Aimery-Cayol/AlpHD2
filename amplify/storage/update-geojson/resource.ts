import { defineFunction } from '@aws-amplify/backend';

export const updateGeoJson = defineFunction({
  name: 'updateGeoJson',
  entry: './handler.ts',
  timeoutSeconds: 60
});