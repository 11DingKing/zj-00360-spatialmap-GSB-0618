import React, { useState, useEffect } from "react";
import MapContainer from "../components/Map/MapContainer";
import Legend from "../components/Map/Legend";
import FilterPanel from "../components/FilterPanel";
import BuildingDetail from "../components/BuildingDetail";
import StatsModal from "../components/StatsModal";
import RedlineAnalysisPanel from "../components/RedlineAnalysisPanel";
import { useBuildings } from "../context/BuildingContext";
import type {
  BuildingWithRelations,
  StatsResult,
  ValidationError,
  RedlineAnalysisResult,
} from "../types";

const MapPage: React.FC = () => {
  const { fetchBuildings, state } = useBuildings();
  const [selectedBuilding, setSelectedBuilding] =
    useState<BuildingWithRelations | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [drawMode, setDrawMode] = useState<
    "none" | "rectangle" | "polygon" | "redline-analyze"
  >("none");
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [redlineResult, setRedlineResult] =
    useState<RedlineAnalysisResult | null>(null);
  const [showRedlinePanel, setShowRedlinePanel] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const handleMapClick = (lat: number, lng: number) => {
    console.log("Map clicked:", lat, lng);
  };

  const handleBuildingClick = (building: BuildingWithRelations) => {
    setSelectedBuilding(building);
    setShowDetail(true);
  };

  const handleStatsResult = (statsResult: StatsResult) => {
    setStats(statsResult);
    setShowStats(true);
  };

  const handleValidationErrors = (errors: ValidationError[]) => {
    setValidationErrors(errors);
  };

  const handleDrawModeChange = (
    mode: "none" | "rectangle" | "polygon" | "redline-analyze",
  ) => {
    setDrawMode(mode);
    if (mode === "none") {
      setPolygonPoints([]);
      setValidationErrors([]);
    }
  };

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
  };

  const handlePolygonPointsChange = (points: [number, number][]) => {
    setPolygonPoints(points);
  };

  const handleRedlineAnalysisResult = (result: RedlineAnalysisResult) => {
    setIsAnalyzing(false);
    setRedlineResult(result);
    setShowRedlinePanel(true);
    setPolygonPoints([]);
  };

  const handleCloseRedlinePanel = () => {
    setShowRedlinePanel(false);
  };

  const handleConflictBuildingClick = (buildingId: string) => {
    const building = state.buildings.find((b) => b.id === buildingId);
    if (building) {
      setSelectedBuilding(building);
      setShowRedlinePanel(false);
      setShowDetail(true);
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-100">
      <div className="absolute top-0 left-0 z-20 h-full">
        <FilterPanel />
      </div>

      <div className="absolute inset-0 pl-72">
        <MapContainer
          onMapClick={handleMapClick}
          onBuildingClick={handleBuildingClick}
          onStatsResult={handleStatsResult}
          onValidationErrors={handleValidationErrors}
          onRedlineAnalysisResult={handleRedlineAnalysisResult}
          onAnalysisStart={handleAnalysisStart}
          drawMode={drawMode}
          onDrawModeChange={handleDrawModeChange}
          polygonPoints={polygonPoints}
          onPolygonPointsChange={handlePolygonPointsChange}
        >
          <Legend />
        </MapContainer>
      </div>

      {validationErrors.length > 0 && drawMode === "polygon" && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-red-500 text-white rounded-xl shadow-lg px-6 py-4 max-w-md">
          <div className="flex items-start space-x-3">
            <i className="fas fa-exclamation-circle text-lg mt-0.5"></i>
            <div>
              <h4 className="font-semibold mb-1">校验错误</h4>
              <ul className="text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-orange-500 text-white rounded-xl shadow-lg px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <span className="font-medium">正在分析管控线冲突...</span>
          </div>
        </div>
      )}

      <BuildingDetail
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        building={selectedBuilding}
      />

      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
      />

      <RedlineAnalysisPanel
        isOpen={showRedlinePanel}
        onClose={handleCloseRedlinePanel}
        result={redlineResult}
        onBuildingClick={handleConflictBuildingClick}
      />

      {state.loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <span className="text-gray-700 font-medium">加载中...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
