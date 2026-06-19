import React, { useEffect, useRef } from 'react';
import L, { type Polygon as LeafletPolygon, type LayerGroup } from 'leaflet';
import type { Redline, Polygon as PolygonType, AnalysisResult } from '../../types';
import { REDLINE_TYPE_COLORS } from '../../types';
import { useMapInstance } from './MapContainer';

interface RedlineLayerProps {
  redlines: Redline[];
  analysisResult: AnalysisResult | null;
  selectionPolygon: PolygonType | null;
  showRedlines: boolean;
}

const RedlineLayer: React.FC<RedlineLayerProps> = ({
  redlines,
  analysisResult,
  selectionPolygon,
  showRedlines,
}) => {
  const { map } = useMapInstance();
  const layerGroupRef = useRef<LayerGroup | null>(null);
  const selectionLayerRef = useRef<LeafletPolygon | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    if (showRedlines) {
      redlines.forEach(redline => {
        try {
          const latlngs = redline.boundary.coordinates[0].map(([lng, lat]) => [lat, lng]);
          const color = REDLINE_TYPE_COLORS[redline.type];

          const polygon = L.polygon(latlngs as L.LatLngExpression[], {
            color: color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.15,
            dashArray: '5, 5',
          });

          polygon.bindTooltip(redline.name, { sticky: true });
          polygon.addTo(layerGroup);
        } catch (e) {
          console.error('Failed to render redline:', redline.name, e);
        }
      });
    }

    if (analysisResult) {
      analysisResult.buildings.forEach(building => {
        if (building.hasConflict && building.outline) {
          try {
            const latlngs = building.outline.coordinates[0].map(([lng, lat]) => [lat, lng]);
            L.polygon(latlngs as L.LatLngExpression[], {
              color: '#EF4444',
              weight: 3,
              fillColor: '#EF4444',
              fillOpacity: 0.4,
            }).addTo(layerGroup).bindTooltip(`⚠️ ${building.name} - 压线建筑`, { sticky: true });
          } catch (e) {
            console.error('Failed to highlight conflict building:', e);
          }
        }
      });

      analysisResult.parcels.forEach(parcel => {
        try {
          const latlngs = parcel.boundary.coordinates[0].map(([lng, lat]) => [lat, lng]);
          L.polygon(latlngs as L.LatLngExpression[], {
            color: '#3B82F6',
            weight: 2,
            fillColor: '#3B82F6',
            fillOpacity: 0.1,
            dashArray: '3, 6',
          }).addTo(layerGroup).bindTooltip(`地块: ${parcel.name}`, { sticky: true });
        } catch (e) {
          console.error('Failed to render parcel:', e);
        }
      });
    }

    if (selectionPolygon) {
      if (selectionLayerRef.current) {
        map.removeLayer(selectionLayerRef.current);
      }
      try {
        const latlngs = selectionPolygon.coordinates[0].map(([lng, lat]) => [lat, lng]);
        selectionLayerRef.current = L.polygon(latlngs as L.LatLngExpression[], {
          color: '#F97316',
          weight: 2,
          fillColor: '#F97316',
          fillOpacity: 0.1,
        }).addTo(map);
      } catch (e) {
        console.error('Failed to render selection polygon:', e);
      }
    } else if (selectionLayerRef.current) {
      map.removeLayer(selectionLayerRef.current);
      selectionLayerRef.current = null;
    }

    return () => {
      if (selectionLayerRef.current && map) {
        map.removeLayer(selectionLayerRef.current);
        selectionLayerRef.current = null;
      }
    };
  }, [map, redlines, analysisResult, selectionPolygon, showRedlines]);

  useEffect(() => {
    return () => {
      if (layerGroupRef.current && map) {
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
    };
  }, [map]);

  return null;
};

export default RedlineLayer;
