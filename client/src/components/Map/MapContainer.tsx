import React, {
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import L, {
  type Map,
  type LatLng,
  type Rectangle,
  type Polygon as LeafletPolygon,
  type CircleMarker,
  type TileLayer,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import BuildingMarkers from "./BuildingMarkers";
import DrawControl from "./DrawControl";
import { buildingApi, redlineApi } from "../../services/api";
import type {
  BuildingWithRelations,
  StatsResult,
  ValidationError,
  RedlineAnalysisResult,
  Polygon,
} from "../../types";

interface MapContainerProps {
  onMapClick?: (lat: number, lng: number) => void;
  onBuildingClick?: (building: BuildingWithRelations) => void;
  onStatsResult?: (stats: StatsResult) => void;
  onValidationErrors?: (errors: ValidationError[]) => void;
  onRedlineAnalysisResult?: (result: RedlineAnalysisResult) => void;
  onAnalysisStart?: () => void;
  drawMode?: "none" | "rectangle" | "polygon" | "redline-analyze";
  onDrawModeChange?: (
    mode: "none" | "rectangle" | "polygon" | "redline-analyze",
  ) => void;
  polygonPoints?: [number, number][];
  onPolygonPointsChange?: (points: [number, number][]) => void;
  onClearAll?: () => void;
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
  onRedlineAnalysisResult,
  onAnalysisStart,
  drawMode = "none",
  onDrawModeChange,
  polygonPoints = [],
  onPolygonPointsChange,
  onClearAll,
  children,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);

  const isDrawingRef = useRef(false);
  const startPointRef = useRef<LatLng | null>(null);
  const tempRectangleRef = useRef<Rectangle | null>(null);
  const polygonMarkersRef = useRef<CircleMarker[]>([]);
  const tempPolygonRef = useRef<LeafletPolygon | null>(null);
  const analysisPolygonRef = useRef<LeafletPolygon | null>(null);
  const redlineLayersRef = useRef<L.Layer[]>([]);
  const isAnalyzingRef = useRef(false);

  const drawModeRef = useRef(drawMode);
  const polygonPointsRef = useRef(polygonPoints);
  const onMapClickRef = useRef(onMapClick);
  const onStatsResultRef = useRef(onStatsResult);
  const onDrawModeChangeRef = useRef(onDrawModeChange);
  const onPolygonPointsChangeRef = useRef(onPolygonPointsChange);
  const onValidationErrorsRef = useRef(onValidationErrors);
  const onRedlineAnalysisResultRef = useRef(onRedlineAnalysisResult);
  const onAnalysisStartRef = useRef(onAnalysisStart);
  const onClearAllRef = useRef(onClearAll);

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
    onRedlineAnalysisResultRef.current = onRedlineAnalysisResult;
  }, [onRedlineAnalysisResult]);

  useEffect(() => {
    onAnalysisStartRef.current = onAnalysisStart;
  }, [onAnalysisStart]);

  useEffect(() => {
    onClearAllRef.current = onClearAll;
  }, [onClearAll]);

  const coordsToGeoJsonPolygon = useCallback(
    (points: [number, number][]): Polygon => {
      const closed = [...points];
      if (
        points.length > 0 &&
        (points[0][0] !== points[points.length - 1][0] ||
          points[0][1] !== points[points.length - 1][1])
      ) {
        closed.push(points[0]);
      }
      return {
        type: "Polygon",
        coordinates: [closed.map(([lat, lng]) => [lng, lat])],
      };
    },
    [],
  );

  const handleDrawComplete = useCallback(
    async (bounds: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    }) => {
      try {
        const response = await buildingApi.getBuildingsWithin(
          bounds.minLng,
          bounds.maxLng,
          bounds.minLat,
          bounds.maxLat,
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
        console.error("获取范围内建筑失败:", error);
      }

      onDrawModeChangeRef.current?.("none");
    },
    [],
  );

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

  const clearAnalysisLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (analysisPolygonRef.current) {
      map.removeLayer(analysisPolygonRef.current);
      analysisPolygonRef.current = null;
    }
  }, []);

  const handleRedlineAnalyze = useCallback(
    async (points: [number, number][]) => {
      if (points.length < 3) return;

      const geoPolygon = coordsToGeoJsonPolygon(points);
      isAnalyzingRef.current = true;

      try {
        onAnalysisStartRef.current?.();

        const map = mapRef.current;
        if (map) {
          clearTempLayers();
          clearAnalysisLayers();
          analysisPolygonRef.current = L.polygon(points, {
            color: "#F97316",
            weight: 3,
            fillColor: "#F97316",
            fillOpacity: 0.15,
            dashArray: "8, 4",
          }).addTo(map);
        }

        onDrawModeChangeRef.current?.("none");

        const response = await redlineApi.analyzeArea(geoPolygon);
        if (response.data.success) {
          onRedlineAnalysisResultRef.current?.(response.data.data);
        }
      } catch (error) {
        console.error("管控线分析失败:", error);
      } finally {
        isAnalyzingRef.current = false;
      }
    },
    [coordsToGeoJsonPolygon, clearTempLayers, clearAnalysisLayers],
  );

  const handlePolygonPointAdd = useCallback(
    async (lat: number, lng: number) => {
      const currentPoints = polygonPointsRef.current;
      const newPoints = [...currentPoints, [lat, lng] as [number, number]];
      onPolygonPointsChangeRef.current?.(newPoints);

      const currentMode = drawModeRef.current;

      if (currentMode === "polygon" && newPoints.length >= 3) {
        try {
          const response = await buildingApi.validateBuilding({
            location: {
              type: "Point",
              coordinates: [newPoints[0][1], newPoints[0][0]],
            },
            outline: coordsToGeoJsonPolygon(newPoints),
            parcelId: "",
          });

          if (response.data.success) {
            onValidationErrorsRef.current?.(response.data.data.errors);
          }
        } catch (error) {
          console.error("验证建筑失败:", error);
        }
      }
    },
    [coordsToGeoJsonPolygon],
  );

  const handleCompletePolygon = useCallback(() => {
    const currentPoints = polygonPointsRef.current;
    const currentMode = drawModeRef.current;

    if (currentPoints.length < 3) return;

    if (currentMode === "redline-analyze") {
      handleRedlineAnalyze(currentPoints);
    } else {
      onDrawModeChangeRef.current?.("none");
    }
  }, [handleRedlineAnalyze]);

  const updatePolygonPreview = useCallback(
    (points: [number, number][], color: string = "#3B82F6") => {
      const map = mapRef.current;
      if (!map) return;

      polygonMarkersRef.current.forEach((m) => map.removeLayer(m));
      polygonMarkersRef.current = [];

      if (tempPolygonRef.current) {
        map.removeLayer(tempPolygonRef.current);
        tempPolygonRef.current = null;
      }

      if (points.length > 0) {
        points.forEach((point, index) => {
          const marker = L.circleMarker([point[0], point[1]], {
            radius: 6,
            fillColor: color === "#F97316" ? "#F97316" : "#EF4444",
            color: "#FFFFFF",
            weight: 2,
            fillOpacity: 1,
          }).addTo(map);
          marker.bindTooltip(`顶点 ${index + 1}`, {
            permanent: true,
            offset: [0, -10],
          });
          polygonMarkersRef.current.push(marker);
        });
      }

      if (points.length >= 3) {
        tempPolygonRef.current = L.polygon(points, {
          color: color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.2,
        }).addTo(map);
      }
    },
    [],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [39.93, 116.45],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    tileLayerRef.current = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
      },
    ).addTo(map);

    mapRef.current = map;

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      const currentDrawMode = drawModeRef.current;

      if (
        currentDrawMode === "polygon" ||
        currentDrawMode === "redline-analyze"
      ) {
        handlePolygonPointAdd(lat, lng);
      } else if (currentDrawMode === "none" && onMapClickRef.current) {
        onMapClickRef.current(lat, lng);
      }
    });

    map.on("mousedown", (e) => {
      if (drawModeRef.current === "rectangle") {
        isDrawingRef.current = true;
        startPointRef.current = e.latlng;
        map.dragging.disable();
      }
    });

    map.on("mousemove", (e) => {
      if (
        drawModeRef.current === "rectangle" &&
        isDrawingRef.current &&
        startPointRef.current
      ) {
        if (tempRectangleRef.current) {
          map.removeLayer(tempRectangleRef.current);
        }
        const bounds = L.latLngBounds(startPointRef.current, e.latlng);
        tempRectangleRef.current = L.rectangle(bounds, {
          color: "#3B82F6",
          weight: 2,
          fillColor: "#3B82F6",
          fillOpacity: 0.1,
          dashArray: "5, 5",
        }).addTo(map);
      }
    });

    map.on("mouseup", (e) => {
      if (
        drawModeRef.current === "rectangle" &&
        isDrawingRef.current &&
        startPointRef.current
      ) {
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

    map.on("dblclick", (e) => {
      const currentDrawMode = drawModeRef.current;
      if (
        (currentDrawMode === "polygon" ||
          currentDrawMode === "redline-analyze") &&
        polygonPointsRef.current.length >= 3
      ) {
        L.DomEvent.stopPropagation(e);
        handleCompletePolygon();
      }
    });

    return () => {
      clearTempLayers();
      clearAnalysisLayers();
      redlineLayersRef.current.forEach((l) => {
        if (mapRef.current) mapRef.current.removeLayer(l);
      });
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, [
    handleDrawComplete,
    handlePolygonPointAdd,
    handleCompletePolygon,
    clearTempLayers,
    clearAnalysisLayers,
  ]);

  useEffect(() => {
    if (drawMode !== "rectangle") {
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
    if (drawMode === "polygon" || drawMode === "redline-analyze") {
      const previewColor =
        drawMode === "redline-analyze" ? "#F97316" : "#3B82F6";
      updatePolygonPreview(polygonPoints, previewColor);
    } else {
      clearTempLayers();
    }
  }, [drawMode, polygonPoints, updatePolygonPreview, clearTempLayers]);

  const prevDrawModeRef = useRef(drawMode);
  useEffect(() => {
    if (
      drawMode === "redline-analyze" &&
      prevDrawModeRef.current !== "redline-analyze"
    ) {
      clearAnalysisLayers();
    }
    prevDrawModeRef.current = drawMode;
  }, [drawMode, clearAnalysisLayers]);

  useEffect(() => {
    if (polygonPoints.length === 0) {
      clearTempLayers();
      if (!isAnalyzingRef.current) {
        clearAnalysisLayers();
      }
    }
  }, [polygonPoints.length, clearTempLayers, clearAnalysisLayers]);

  return (
    <MapContext.Provider value={{ map: mapRef.current }}>
      <div className="relative w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        <BuildingMarkers
          map={mapRef.current}
          onBuildingClick={onBuildingClick}
        />

        {children}

        <DrawControl
          map={mapRef.current}
          drawMode={drawMode}
          onDrawModeChange={onDrawModeChange || (() => {})}
          polygonPoints={polygonPoints}
          onPolygonPointsChange={onPolygonPointsChange || (() => {})}
          onAnalyze={handleCompletePolygon}
        />
      </div>
    </MapContext.Provider>
  );
};

export default MapContainer;
