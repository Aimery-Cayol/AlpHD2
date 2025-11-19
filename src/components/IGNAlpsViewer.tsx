"use client";

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    Gp: any;
  }
}

const IGNAlpsViewer: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the Geoportal SDK script
    const script = document.createElement('script');
    script.src = 'https://ignf.github.io/geoportal-sdk/latest/dist/2d/GpSDK2D.js';
    script.onload = () => {
      // Once the script is loaded, initialize the map
      if (window.Gp) {
        window.Gp.Map.load(
          mapRef.current!,
          {
            apiKey: "altimetrie",
            // , cartes, cartovecto, ortho, topographie
            viewMode: "2d",
            enginePath2d: "https://ignf.github.io/geoportal-sdk/latest/dist/2d/",
            zoom: 10,
            center: {
              x: 6.642212,
              y: 45.811339
            },
            layersOptions: {
              "ELEVATION.CONTOUR.LINE": {format: "WFS", styleOptions: {}},
              "ORTHOIMAGERY.ORTHOPHOTOS": {},
              // "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES.MNS": {type: "elevation"},
              // "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES": {
              //   type: "elevation"
              // }
            },
            controlsOptions: {
              "layerSwitcher": {}
            }
          }
        );

        // Display SDK version info
        if (infoRef.current) {
          infoRef.current.innerHTML = `<p> SDK version ${window.Gp.sdkVersion} (${window.Gp.sdkDate})</p>`;
        }
      }
    };
    document.head.appendChild(script);

    // Add CSS for the map
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://ignf.github.io/geoportal-sdk/latest/dist/2d/GpSDK2D.css';
    document.head.appendChild(link);

    return () => {
      // Cleanup if needed
      document.head.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div id="map" ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div id="info" ref={infoRef} style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.8)',
        padding: '5px',
        fontFamily: 'monospace',
        fontSize: '10px'
      }} />
    </div>
  );
};

export default IGNAlpsViewer;