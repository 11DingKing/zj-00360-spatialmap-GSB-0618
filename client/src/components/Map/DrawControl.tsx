import React from "react";
import type { Map } from "leaflet";

interface DrawControlProps {
  map: Map | null;
  drawMode: "none" | "rectangle" | "polygon" | "analyze";
  onDrawModeChange: (
    mode: "none" | "rectangle" | "polygon" | "analyze",
  ) => void;
  polygonPoints?: [number, number][];
  onPolygonPointsChange?: (points: [number, number][]) => void;
  onAnalyzeComplete?: (points: [number, number][]) => void;
}

const DrawControl: React.FC<DrawControlProps> = ({
  drawMode,
  onDrawModeChange,
  polygonPoints = [],
  onPolygonPointsChange,
  onAnalyzeComplete,
}) => {
  const handleRectangleClick = () => {
    if (drawMode === "rectangle") {
      onDrawModeChange("none");
    } else {
      onDrawModeChange("rectangle");
    }
  };

  const handleAnalyzeClick = () => {
    if (drawMode === "analyze") {
      onDrawModeChange("none");
      onPolygonPointsChange?.([]);
    } else {
      onDrawModeChange("analyze");
      onPolygonPointsChange?.([]);
    }
  };

  const handleAddBuildingClick = () => {
    if (drawMode === "polygon") {
      onDrawModeChange("none");
      onPolygonPointsChange?.([]);
    } else {
      onDrawModeChange("polygon");
      onPolygonPointsChange?.([]);
    }
  };

  const handleClearClick = () => {
    onDrawModeChange("none");
    onPolygonPointsChange?.([]);
  };

  const handleCompletePolygon = () => {
    if (polygonPoints.length >= 3) {
      if (drawMode === "analyze") {
        onAnalyzeComplete?.(polygonPoints);
      } else {
        onDrawModeChange("none");
      }
    }
  };

  const getButtonClass = (
    active: boolean,
    activeColor: string = "bg-blue-500",
  ) => {
    if (active) {
      return `${activeColor} text-white shadow-lg`;
    }
    return "bg-white text-gray-700 hover:bg-gray-50";
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
      <div className="bg-white rounded-xl shadow-lg p-2 flex flex-col space-y-1">
        <button
          onClick={handleRectangleClick}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all ${getButtonClass(drawMode === "rectangle")}`}
          title="框选统计"
        >
          <i className="fas fa-vector-square"></i>
          <span className="text-sm font-medium">框选统计</span>
        </button>

        <button
          onClick={handleAnalyzeClick}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all ${getButtonClass(drawMode === "analyze", "bg-orange-500")}`}
          title="管控线冲突体检"
        >
          <i className="fas fa-shield-alt"></i>
          <span className="text-sm font-medium">管控体检</span>
        </button>

        <button
          onClick={handleAddBuildingClick}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all ${getButtonClass(drawMode === "polygon", "bg-green-500")}`}
          title="新增房屋"
        >
          <i className="fas fa-plus-circle"></i>
          <span className="text-sm font-medium">新增房屋</span>
        </button>

        <div className="border-t border-gray-100 my-1"></div>

        <button
          onClick={handleClearClick}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
          title="清除绘制"
        >
          <i className="fas fa-eraser"></i>
          <span className="text-sm font-medium">清除绘制</span>
        </button>
      </div>

      {drawMode === "rectangle" && (
        <div className="bg-blue-500 text-white rounded-xl shadow-lg px-4 py-3 text-sm">
          <div className="flex items-center space-x-2">
            <i className="fas fa-info-circle"></i>
            <span>在地图上按住并拖动绘制矩形</span>
          </div>
        </div>
      )}

      {drawMode === "polygon" && (
        <div className="bg-green-500 text-white rounded-xl shadow-lg px-4 py-3 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <i className="fas fa-info-circle"></i>
              <span>点击地图依次添加多边形顶点</span>
            </div>
            <div className="flex items-center space-x-2 text-xs opacity-90">
              <i className="fas fa-circle text-xs"></i>
              <span>已添加 {polygonPoints.length} 个顶点</span>
            </div>
            {polygonPoints.length < 3 && (
              <div className="flex items-center space-x-2 text-xs opacity-90">
                <i className="fas fa-exclamation-triangle text-xs"></i>
                <span>至少需要 3 个顶点</span>
              </div>
            )}
            {polygonPoints.length >= 3 && (
              <button
                onClick={handleCompletePolygon}
                className="w-full mt-2 py-2 bg-white text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
              >
                <i className="fas fa-check mr-2"></i>
                完成绘制
              </button>
            )}
          </div>
        </div>
      )}

      {drawMode === "analyze" && (
        <div className="bg-orange-500 text-white rounded-xl shadow-lg px-4 py-3 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <i className="fas fa-shield-alt"></i>
              <span>点击地图圈选体检区域</span>
            </div>
            <div className="flex items-center space-x-2 text-xs opacity-90">
              <i className="fas fa-circle text-xs"></i>
              <span>已添加 {polygonPoints.length} 个顶点</span>
            </div>
            {polygonPoints.length < 3 && (
              <div className="flex items-center space-x-2 text-xs opacity-90">
                <i className="fas fa-exclamation-triangle text-xs"></i>
                <span>至少需要 3 个顶点</span>
              </div>
            )}
            {polygonPoints.length >= 3 && (
              <button
                onClick={handleCompletePolygon}
                className="w-full mt-2 py-2 bg-white text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
              >
                <i className="fas fa-search mr-2"></i>
                开始体检
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawControl;
