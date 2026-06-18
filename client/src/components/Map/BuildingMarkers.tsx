import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import L, { type Map, type CircleMarker, type Polygon } from 'leaflet';
import { useBuildings } from '../../context/BuildingContext';
import { useFilter } from '../../context/FilterContext';
import { getUsageColor, getYearColor, getColorWithOpacity } from '../../utils/colorUtils';
import { USAGE_LABELS } from '../../utils/constants';
import type { BuildingWithRelations } from '../../types';

interface BuildingMarkersProps {
  map: Map | null;
  onBuildingClick?: (building: BuildingWithRelations) => void;
}

interface BuildingLayer {
  marker: CircleMarker;
  polygon?: Polygon;
  buildingId: string;
}

const BuildingMarkers: React.FC<BuildingMarkersProps> = ({
  map,
  onBuildingClick,
}) => {
  const { state } = useBuildings();
  const { state: filterState } = useFilter();
  const { buildings } = state;
  const { usage, yearStart, yearEnd, isCoded, colorMode } = filterState;

  const layersRef = useRef<globalThis.Map<string, BuildingLayer>>(new globalThis.Map());

  const isBuildingFiltered = useCallback((building: BuildingWithRelations): boolean => {
    if (usage.length > 0 && !usage.includes(building.usage)) {
      return false;
    }
    if (building.buildYear < yearStart || building.buildYear > yearEnd) {
      return false;
    }
    if (isCoded !== null && building.isCoded !== isCoded) {
      return false;
    }
    return true;
  }, [usage, yearStart, yearEnd, isCoded]);

  const getBuildingColor = useCallback((building: BuildingWithRelations): string => {
    if (colorMode === 'usage') {
      return getUsageColor(building.usage);
    }
    return getYearColor(building.buildYear);
  }, [colorMode]);

  const getMarkerOpacity = useCallback((building: BuildingWithRelations): number => {
    if (isBuildingFiltered(building)) {
      return 1;
    }
    return 0.3;
  }, [isBuildingFiltered]);

  const getTooltipContent = useCallback((building: BuildingWithRelations) => {
    return `
      <div class="text-xs" style="min-width: 120px;">
        <p class="font-semibold text-gray-800">${building.name}</p>
        <p class="text-gray-600">用途: ${USAGE_LABELS[building.usage]}</p>
        <p class="text-gray-600">年代: ${building.buildYear}年</p>
      </div>
    `;
  }, []);

  const createPopupContent = useCallback((building: BuildingWithRelations): HTMLElement => {
    const container = document.createElement('div');
    container.className = 'min-w-48';
    container.innerHTML = `
      <h3 class="font-bold text-gray-800 mb-2">${building.name}</h3>
      <div class="space-y-1 text-sm">
        <p><span class="text-gray-500">地址:</span> <span class="text-gray-800">${building.address}</span></p>
        <p><span class="text-gray-500">用途:</span> <span class="text-gray-800">${USAGE_LABELS[building.usage]}</span></p>
        <p><span class="text-gray-500">建成年代:</span> <span class="text-gray-800">${building.buildYear}年</span></p>
        <p><span class="text-gray-500">层数:</span> <span class="text-gray-800">地上${building.floors}层/地下${building.undergroundFloors}层</span></p>
        <p><span class="text-gray-500">建筑面积:</span> <span class="text-gray-800">${building.buildingArea.toLocaleString()}m²</span></p>
      </div>
    `;

    if (onBuildingClick) {
      const button = document.createElement('button');
      button.className = 'mt-3 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors';
      button.textContent = '查看详情';
      button.addEventListener('click', () => {
        onBuildingClick(building);
      });
      container.appendChild(button);
    }

    return container;
  }, [onBuildingClick]);

  const clearAllLayers = useCallback(() => {
    if (!map) return;
    layersRef.current.forEach((layer: BuildingLayer) => {
      map.removeLayer(layer.marker);
      if (layer.polygon) {
        map.removeLayer(layer.polygon);
      }
    });
    layersRef.current.clear();
  }, [map]);

  const createBuildingLayer = useCallback((building: BuildingWithRelations): BuildingLayer | null => {
    if (!map || !building.location?.coordinates) return null;

    const color = getBuildingColor(building);
    const opacity = getMarkerOpacity(building);
    const fillColor = getColorWithOpacity(color, opacity * 0.8);
    const outlineColor = getColorWithOpacity(color, opacity * 0.6);

    const [lng, lat] = building.location.coordinates;
    const marker = L.circleMarker([lat, lng], {
      radius: 8,
      color: color,
      fillColor: fillColor,
      fillOpacity: opacity,
      weight: 2,
    }).addTo(map);

    marker.bindTooltip(getTooltipContent(building), {
      direction: 'top',
      offset: [0, -10],
      opacity: 0.9,
    });

    marker.bindPopup(createPopupContent(building));

    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      onBuildingClick?.(building);
    });

    let polygon: Polygon | undefined;
    if (building.outline?.coordinates && building.outline.coordinates.length > 0) {
      const positions = building.outline.coordinates[0].map(([lngPos, latPos]) => [latPos, lngPos] as [number, number]);
      polygon = L.polygon(positions, {
        color: outlineColor,
        fillColor: outlineColor,
        fillOpacity: opacity * 0.3,
        weight: 2,
      }).addTo(map);

      polygon.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onBuildingClick?.(building);
      });

      polygon.bindTooltip(getTooltipContent(building), {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.9,
      });
    }

    return { marker, polygon, buildingId: building.id };
  }, [map, getBuildingColor, getMarkerOpacity, getTooltipContent, createPopupContent, onBuildingClick]);

  const updateLayerStyle = useCallback((layer: BuildingLayer, building: BuildingWithRelations) => {
    const color = getBuildingColor(building);
    const opacity = getMarkerOpacity(building);
    const fillColor = getColorWithOpacity(color, opacity * 0.8);
    const outlineColor = getColorWithOpacity(color, opacity * 0.6);

    layer.marker.setStyle({
      color: color,
      fillColor: fillColor,
      fillOpacity: opacity,
    });

    if (layer.polygon) {
      layer.polygon.setStyle({
        color: outlineColor,
        fillColor: outlineColor,
        fillOpacity: opacity * 0.3,
      });
    }
  }, [getBuildingColor, getMarkerOpacity]);

  const buildingsWithLocation = useMemo(() => {
    return buildings.filter((b) => b.location && b.location.coordinates);
  }, [buildings]);

  const buildingIds = useMemo(() => {
    return new Set(buildingsWithLocation.map((b) => b.id));
  }, [buildingsWithLocation]);

  useEffect(() => {
    if (!map) return;

    layersRef.current.forEach((layer: BuildingLayer, id: string) => {
      if (!buildingIds.has(id)) {
        map.removeLayer(layer.marker);
        if (layer.polygon) {
          map.removeLayer(layer.polygon);
        }
        layersRef.current.delete(id);
      }
    });

    buildingsWithLocation.forEach((building) => {
      const existingLayer = layersRef.current.get(building.id);
      if (existingLayer) {
        updateLayerStyle(existingLayer, building);
      } else {
        const newLayer = createBuildingLayer(building);
        if (newLayer) {
          layersRef.current.set(building.id, newLayer);
        }
      }
    });
  }, [map, buildingsWithLocation, buildingIds, createBuildingLayer, updateLayerStyle]);

  useEffect(() => {
    return () => {
      clearAllLayers();
    };
  }, [clearAllLayers]);

  return null;
};

export default BuildingMarkers;
