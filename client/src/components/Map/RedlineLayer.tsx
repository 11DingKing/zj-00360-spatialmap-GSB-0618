import React, { useEffect, useRef } from 'react';
import L, { type Map, type Polygon as LeafletPolygon } from 'leaflet';
import type { Redline } from '../../types';
import { REDLINE_TYPE_COLORS } from '../../utils/constants';

interface RedlineLayerProps {
  map: Map | null;
  redlines: Redline[];
  showRedlines?: boolean;
}

const RedlineLayer: React.FC<RedlineLayerProps> = ({ map, redlines, showRedlines = true }) => {
  const layersRef = useRef<LeafletPolygon[]>([]);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    layersRef.current.forEach(layer => {
      layerGroupRef.current?.removeLayer(layer);
    });
    layersRef.current = [];

    if (!showRedlines) {
      return;
    }

    redlines.forEach(redline => {
      const color = redline.color || REDLINE_TYPE_COLORS[redline.type];
      const latlngs = redline.boundary.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);

      const polygon = L.polygon(latlngs, {
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.15,
        dashArray: '5, 5',
      });

      polygon.bindTooltip(`
        <div class="font-semibold">${redline.name}</div>
        <div class="text-xs opacity-80">${redline.description || ''}</div>
      `, { sticky: true });

      polygon.addTo(layerGroupRef.current!);
      layersRef.current.push(polygon);
    });

    return () => {
      layersRef.current.forEach(layer => {
        layerGroupRef.current?.removeLayer(layer);
      });
      layersRef.current = [];
    };
  }, [map, redlines, showRedlines]);

  return null;
};

export default RedlineLayer;
