import React, { useRef, useEffect, useCallback, createContext, useContext, useState } from 'react';
import L, { type Map, type LatLng, type Rectangle, type Polygon, type CircleMarker, type TileLayer } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BuildingMarkers from './BuildingMarkers';
import DrawControl from './DrawControl';
import RedlineLayer from './RedlineLayer';
import { buildingApi, redlineApi } from '../../services/api';
import type { BuildingWithRelations, StatsResult, ValidationError, Redline } from '../../types';

interface MapContainerProps {
  onMapClick?: (lat: number, lng: number) => void;
  onBuildingClick?: (building: BuildingWithRelations) => void;
  onStatsResult?: (stats: StatsResult) => void;
  onValidationErrors?: (errors: ValidationError[]) => void;
  onAnalysisPolygonDrawn?: (points: [number, number][]) => void;
  drawMode?: 'none' | 'rectangle' | 'polygon' | 'analysis';
  onDrawModeChange?: (mode: 'none' | 'rectangle' | 'polygon' | 'analysis') => void;
  polygonPoints?: [number, number][];
  onPolygonPointsChange?: (points: [number, number][]) => void;
  children?: React.ReactNode;
}

interface MapContextType {
  map: Map | null;
}

const MapContext = createContext<MapContextType>({ map: null });

export function useMapInstance() {
  return useContext(MapContext);
}

const MapContainer: React.FC<MapContainerProps> = ({
  onMapClick,
  onBuildingClick,
  onStatsResult,
  onValidationErrors,
  onAnalysisPolygonDrawn,
  drawMode = 'none',
  onDrawModeChange,
  polygonPoints = [],
  onPolygonPointsChange,
  children,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);

  const isDrawingRef = useRef(false);
  const startPointRef = useRef<LatLng | null>(null);
  const tempRectangleRef = useRef<Rectangle | null>(null);
  const polygonMarkersRef = useRef<CircleMarker[]>([]);
  const tempPolygonRef = useRef<Polygon | null>(null);

  const [redlines, setRedlines] = useState<Redline[]>([]);
  const [showRedlines, setShowRedlines] = useState(true);

  const drawModeRef = useRef(drawMode);
  const polygonPointsRef = useRef(polygonPoints);
  const onMapClickRef = useRef(onMapClick);
  const onStatsResultRef = useRef(onStatsResult);
  const onDrawModeChangeRef = useRef(onDrawModeChange);
  const onPolygonPointsChangeRef = useRef(onPolygonPointsChange);
  const onValidationErrorsRef = useRef(onValidationErrors);
  const onAnalysisPolygonDrawnRef = useRef(onAnalysisPolygonDrawn);

  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  useEffect(() => {
    polygonPointsRef.current = polygonPoints;
  }, [polygonPoints]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    onStatsResultRef.current = onStatsResult;
  }, [onStatsResult]);

  useEffect(() => {
    onDrawModeChangeRef.current = onDrawModeChange;
  }, [onDrawModeChange]);

  useEffect(() => {
    onPolygonPointsChangeRef.current = onPolygonPointsChange;
  }, [onPolygonPointsChange]);

  useEffect(() => {
    onValidationErrorsRef.current = onValidationErrors;
  }, [onValidationErrors]);

  useEffect(() => {
    onAnalysisPolygonDrawnRef.current = onAnalysisPolygonDrawn;
  }, [onAnalysisPolygonDrawn]);

  useEffect(() => {
    const loadRedlines = async () => {
      try {
        const response = await redlineApi.getRedlines();
        if (response.data.success) {
          setRedlines(response.data.data);
        }
      } catch (error) {
        console.error('加载管控线失败:', error);
      }
    };
    loadRedlines();
  }, []);

  const handleDrawComplete = useCallback(async (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => {
    try {
      const response = await buildingApi.getBuildingsWithin(
        bounds.minLng,
        bounds.maxLng,
        bounds.minLat,
        bounds.maxLat
      );
      
      if (response.data.success) {
        const buildings = response.data.data;
        const usageCounts: Record<string, number> = {};
        const yearCounts: Record<number, number> = {};
        
        buildings.forEach((b) => {
          usageCounts[b.usage] = (usageCounts[b.usage] || 0) + 1;
          yearCounts[b.buildYear] = (yearCounts[b.buildYear] || 0) + 1;
        });
        
        const byUsage = Object.entries(usageCounts).map(([usage, count]) => ({
          usage: usage as any,
          count,
          percentage: (count / buildings.length) * 100,
        }));
        
        const byYear = Object.entries(yearCounts)
          .map(([year, count]) => ({ year: parseInt(year), count }))
          .sort((a, b) => a.year - b.year);
        
        onStatsResultRef.current?.({
          totalCount: buildings.length,
          byUsage,
          byYear,
        });
      }
    } catch (error) {
      console.error('获取范围内建筑失败:', error);
    }
    
    onDrawModeChangeRef.current?.('none');
  }, []);

  const handlePolygonPointAdd = useCallback(async (lat: number, lng: number) => {
    const currentPoints = polygonPointsRef.current;
    const newPoints = [...currentPoints, [lat, lng] as [number, number]];
    onPolygonPointsChangeRef.current?.(newPoints);

    const mode = drawModeRef.current;
    
    if (mode === 'polygon' && newPoints.length >= 3) {
      try {
        const response = await buildingApi.validateBuilding({
          location: {
            type: 'Point',
            coordinates: [newPoints[0][1], newPoints[0][0]],
          },
          outline: {
            type: 'Polygon',
            coordinates: [[...newPoints, newPoints[0]].map(([la, lo]) => [lo, la])],
          },
          parcelId: '',
        });
        
        if (response.data.success) {
          onValidationErrorsRef.current?.(response.data.data.errors);
        }
      } catch (error) {
        console.error('验证建筑失败:', error);
      }
    }
  }, []);

  const handlePolygonComplete = useCallback((points: [number, number][]) => {
    const mode = drawModeRef.current;

    if (mode === 'analysis') {
      onAnalysisPolygonDrawnRef.current?.(points);
    }
    onDrawModeChangeRef.current?.('none');
  }, []);

  const clearTempLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tempRectangleRef.current) {
      map.removeLayer(tempRectangleRef.current);
      tempRectangleRef.current = null;
    }

    polygonMarkersRef.current.forEach((m) => map.removeLayer(m));
    polygonMarkersRef.current = [];

    if (tempPolygonRef.current) {
      map.removeLayer(tempPolygonRef.current);
      tempPolygonRef.current = null;
    }
  }, []);

  const updatePolygonPreview = useCallback((points: [number, number][]) => {
    const map = mapRef.current;
    if (!map) return;

    polygonMarkersRef.current.forEach((m) => map.removeLayer(m));
    polygonMarkersRef.current = [];

    if (tempPolygonRef.current) {
      map.removeLayer(tempPolygonRef.current);
      tempPolygonRef.current = null;
    }

    const mode = drawModeRef.current;
    const isAnalysis = mode === 'analysis';

    if (points.length > 0) {
      points.forEach((point, index) => {
        const marker = L.circleMarker([point[0], point[1]], {
          radius: 6,
          fillColor: isAnalysis ? '#EF4444' : '#22C55E',
          color: '#FFFFFF',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map);
        marker.bindTooltip(`顶点 ${index + 1}`, { permanent: true, offset: [0, -10] });
        polygonMarkersRef.current.push(marker);
      });
    }

    if (points.length >= 3) {
      tempPolygonRef.current = L.polygon(points, {
        color: isAnalysis ? '#EF4444' : '#3B82F6',
        weight: 2,
        fillColor: isAnalysis ? '#EF4444' : '#3B82F6',
        fillOpacity: 0.2,
      }).addTo(map);
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [39.93, 116.45],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const currentDrawMode = drawModeRef.current;
      
      if (currentDrawMode === 'polygon' || currentDrawMode === 'analysis') {
        handlePolygonPointAdd(lat, lng);
      } else if (currentDrawMode === 'none' && onMapClickRef.current) {
        onMapClickRef.current(lat, lng);
      }
    });

    map.on('mousedown', (e) => {
      if (drawModeRef.current === 'rectangle') {
        isDrawingRef.current = true;
        startPointRef.current = e.latlng;
        map.dragging.disable();
      }
    });

    map.on('mousemove', (e) => {
      if (drawModeRef.current === 'rectangle' && isDrawingRef.current && startPointRef.current) {
        if (tempRectangleRef.current) {
          map.removeLayer(tempRectangleRef.current);
        }
        const bounds = L.latLngBounds(startPointRef.current, e.latlng);
        tempRectangleRef.current = L.rectangle(bounds, {
          color: '#3B82F6',
          weight: 2,
          fillColor: '#3B82F6',
          fillOpacity: 0.1,
          dashArray: '5, 5',
        }).addTo(map);
      }
    });

    map.on('mouseup', (e) => {
      if (drawModeRef.current === 'rectangle' && isDrawingRef.current && startPointRef.current) {
        isDrawingRef.current = false;
        map.dragging.enable();
        
        if (tempRectangleRef.current) {
          map.removeLayer(tempRectangleRef.current);
          tempRectangleRef.current = null;
        }
        
        const bounds = L.latLngBounds(startPointRef.current, e.latlng);
        handleDrawComplete({
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast(),
        });
        
        startPointRef.current = null;
      }
    });

    return () => {
      clearTempLayers();
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, [handleDrawComplete, handlePolygonPointAdd, clearTempLayers]);

  useEffect(() => {
    if (drawMode !== 'rectangle') {
      if (tempRectangleRef.current && mapRef.current) {
        mapRef.current.removeLayer(tempRectangleRef.current);
        tempRectangleRef.current = null;
      }
      isDrawingRef.current = false;
      startPointRef.current = null;
      if (mapRef.current) {
        mapRef.current.dragging.enable();
      }
    }
  }, [drawMode]);

  useEffect(() => {
    if (drawMode === 'polygon' || drawMode === 'analysis') {
      updatePolygonPreview(polygonPoints);
    } else {
      clearTempLayers();
    }
  }, [drawMode, polygonPoints, updatePolygonPreview, clearTempLayers]);

  const handleToggleRedlines = () => {
    setShowRedlines(prev => !prev);
  };

  return (
    <MapContext.Provider value={{ map: mapRef.current }}>
      <div className="relative w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        
        <BuildingMarkers
          map={mapRef.current}
          onBuildingClick={onBuildingClick}
        />
        
        <RedlineLayer
          map={mapRef.current}
          redlines={redlines}
          showRedlines={showRedlines}
        />
        
        {children}
        
        <DrawControl
          map={mapRef.current}
          drawMode={drawMode}
          onDrawModeChange={onDrawModeChange || (() => {})}
          polygonPoints={polygonPoints}
          onPolygonPointsChange={onPolygonPointsChange || (() => {})}
          onPolygonComplete={handlePolygonComplete}
          showRedlines={showRedlines}
          onToggleRedlines={handleToggleRedlines}
        />
      </div>
    </MapContext.Provider>
  );
};

export default MapContainer;
