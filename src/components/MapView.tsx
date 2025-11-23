// import React, { useEffect } from "react";
// import "ol/ol.css";
// import Map from "ol/Map";
// import View from "ol/View";
// import TileLayer from "ol/layer/Tile";
// import OSM from "ol/source/OSM";

// import { bbox } from "ol/loadingstrategy";
// import VectorLayer from "ol/layer/Vector";
// import VectorSource from "ol/source/Vector";
// import GeoJSON from "ol/format/GeoJSON";

// import * as Gp from 'geoportal-extensions-openlayers';

// // https://github.com/IGNF/geoportal-extensions/blob/develop/doc/README-openlayers.md#mise-en-oeuvre

// const Ol = Gp.olExtended;

// function MapView() {
//   useEffect(() => {
//     const map = new Map({
//       target: "map",
//       layers: [
//         new Ol.layer.GeoportalWMTS({
//             layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2"
//         }),
//       ],
//       view: new View({
//         center: [0, 0],
//         zoom: 2,
//       }),
//     });

//     const wfsSource = new VectorSource({
//       format: new GeoJSON(),
//       url: function (extent) {
//         return (
//           "https://data.geopf.fr/wfs?" +
//           "service=WFS&" +
//           "version=2.0.0&" +
//           "request=GetFeature&" +
//           "typename=BDTOPO_V3:batiment&" + // Nom de la couche
//           "outputFormat=application/json&" +
//           "srsname=EPSG:3857&" +
//           "bbox=" +
//           extent.join(",") +
//           ",EPSG:3857"
//         );
//       },
//       strategy: bbox, // Charge par emprise visible
//     });

//     const wfsLayer = new VectorLayer({
//       source: wfsSource,
//     });

//     map.addLayer(wfsLayer);

//     return () => {
//       map.setTarget(null);
//     };
//   }, []);
//   return <div id="map" style={{ width: "100%", height: "400px" }} />;
// }

// export default MapView;
