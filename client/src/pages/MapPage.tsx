import React, { useState, useEffect } from 'react';
import MapContainer from '../components/Map/MapContainer';
import Legend from '../components/Map/Legend';
import FilterPanel from '../components/FilterPanel';
import BuildingDetail from '../components/BuildingDetail';
import StatsModal from '../components/StatsModal';
import RedlineAnalysisPanel from '../components/RedlineAnalysisPanel';
import RedlineLayer from '../components/Map/RedlineLayer';
import { useBuildings } from '../context/BuildingContext';
import { redlineApi } from '../services/api';
import type {
  BuildingWithRelations,
  StatsResult,
  ValidationError,
  AnalysisResult,
  Polygon,
  Redline,
} from '../types';

interface MapControlsProps {
  showRedlines: boolean;
  setShowRedlines: (v: boolean) => void;
  redlines: Redline[];
  analysisResult: AnalysisResult | null;
  selectionPolygon: Polygon | null;
}

const MapControls: React.FC<MapControlsProps> = ({
  showRedlines,
  setShowRedlines,
  redlines,
  analysisResult,
  selectionPolygon,
}) => {
  return (
    <>
      <Legend />
      <RedlineLayer
        redlines={redlines}
        analysisResult={analysisResult}
        selectionPolygon={selectionPolygon}
        showRedlines={showRedlines}
      />

      <div className="absolute top-4 left-8 z-10 flex items-center space-x-3">
        <button
          onClick={() => setShowRedlines(!showRedlines)}
          className={`px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center space-x-2 text-sm font-medium ${
            showRedlines
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <i className="fas fa-layer-group"></i>
          <span>管控线图层</span>
          {showRedlines && <i className="fas fa-check ml-1"></i>}
        </button>
      </div>
    </>
  );
};

const MapPage: React.FC = () => {
  const { fetchBuildings, state } = useBuildings();
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingWithRelations | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [drawMode, setDrawMode] = useState<'none' | 'rectangle' | 'polygon' | 'analyze'>('none');
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectionPolygon, setSelectionPolygon] = useState<Polygon | null>(null);
  const [redlines, setRedlines] = useState<Redline[]>([]);
  const [showRedlines, setShowRedlines] = useState(true);

  useEffect(() => {
    fetchBuildings();
    loadRedlines();
  }, [fetchBuildings]);

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

  const handleMapClick = (lat: number, lng: number) => {
    console.log('Map clicked:', lat, lng);
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

  const handleAnalysisResult = (result: AnalysisResult, polygon: Polygon) => {
    setAnalysisResult(result);
    setSelectionPolygon(polygon);
    setShowAnalysis(true);
    setPolygonPoints([]);
  };

  const handleDrawModeChange = (mode: 'none' | 'rectangle' | 'polygon' | 'analyze') => {
    setDrawMode(mode);
    if (mode === 'none') {
      setPolygonPoints([]);
      setValidationErrors([]);
    }
  };

  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
    setAnalysisResult(null);
    setSelectionPolygon(null);
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
          onAnalysisResult={handleAnalysisResult}
          drawMode={drawMode}
          onDrawModeChange={handleDrawModeChange}
          polygonPoints={polygonPoints}
          onPolygonPointsChange={setPolygonPoints}
        >
          <MapControls
            showRedlines={showRedlines}
            setShowRedlines={setShowRedlines}
            redlines={redlines}
            analysisResult={analysisResult}
            selectionPolygon={selectionPolygon}
          />
        </MapContainer>
      </div>

      <RedlineAnalysisPanel
        isOpen={showAnalysis}
        onClose={handleCloseAnalysis}
        result={analysisResult}
      />

      {validationErrors.length > 0 && drawMode === 'polygon' && (
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
