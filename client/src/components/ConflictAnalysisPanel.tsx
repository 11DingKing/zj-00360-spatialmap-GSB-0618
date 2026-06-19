import React from 'react';
import type { AnalysisResult, BuildingWithRelations, ConflictBuilding } from '../types';
import { REDLINE_TYPE_LABELS, REDLINE_TYPE_COLORS, USAGE_LABELS } from '../utils/constants';

interface ConflictAnalysisPanelProps {
  result: AnalysisResult | null;
  loading: boolean;
  onClose: () => void;
  onBuildingClick?: (building: BuildingWithRelations) => void;
}

const ConflictAnalysisPanel: React.FC<ConflictAnalysisPanelProps> = ({
  result,
  loading,
  onClose,
  onBuildingClick,
}) => {
  if (loading) {
    return (
      <div className="absolute top-4 right-4 z-20 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent mr-3"></div>
          <span className="text-gray-700 font-medium">正在进行管控线冲突体检...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const conflictRate = result.totalBuildings > 0
    ? ((result.totalConflictBuildings / result.totalBuildings) * 100).toFixed(1)
    : '0';

  return (
    <div className="absolute top-4 right-4 z-20 w-[480px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white text-lg font-bold flex items-center">
              <i className="fas fa-shield-alt mr-2"></i>
              管控线冲突体检结果
            </h3>
            <p className="text-red-100 text-sm mt-1">
              圈选范围内发现 {result.totalConflictBuildings} 栋建筑存在冲突
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        <div className="p-5 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-gray-800">{result.totalBuildings}</div>
              <div className="text-xs text-gray-500 mt-1">建筑总数</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-red-600">{result.totalConflictBuildings}</div>
              <div className="text-xs text-gray-500 mt-1">冲突建筑</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-blue-600">{result.totalParcels}</div>
              <div className="text-xs text-gray-500 mt-1">涉及地块</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">冲突率</span>
              <span className="font-semibold text-red-600">{conflictRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${conflictRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {result.conflictSummary.length > 0 && (
          <div className="p-5 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <i className="fas fa-chart-pie mr-2 text-gray-400"></i>
              按管控线类型统计
            </h4>
            <div className="space-y-2">
              {result.conflictSummary.map((item) => (
                <div key={item.type} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                    style={{ backgroundColor: REDLINE_TYPE_COLORS[item.type] }}
                  ></div>
                  <span className="text-sm text-gray-600 flex-1">{item.typeName}</span>
                  <span className="text-sm font-semibold" style={{ color: REDLINE_TYPE_COLORS[item.type] }}>
                    {item.count} 栋
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <i className="fas fa-exclamation-triangle mr-2 text-red-400"></i>
            冲突建筑明细 ({result.conflictBuildings.length})
          </h4>
          <div className="space-y-2">
            {result.conflictBuildings.map((cb) => (
              <ConflictBuildingItem
                key={cb.building.id}
                conflictBuilding={cb}
                onClick={() => onBuildingClick?.(cb.building)}
              />
            ))}
            {result.conflictBuildings.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <i className="fas fa-check-circle text-4xl mb-2 text-green-400"></i>
                <p>太棒了！该区域内未发现建筑压线</p>
              </div>
            )}
          </div>
        </div>

        {result.buildingsInArea.length > result.totalConflictBuildings && (
          <div className="p-5 bg-gray-50 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <i className="fas fa-info-circle mr-2 text-blue-400"></i>
              区域内其他建筑 ({result.buildingsInArea.length - result.totalConflictBuildings})
            </h4>
            <p className="text-xs text-gray-500">
              另有 {result.buildingsInArea.length - result.totalConflictBuildings} 栋建筑在圈选范围内，但未与管控线相交。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ConflictBuildingItemProps {
  conflictBuilding: ConflictBuilding;
  onClick?: () => void;
}

const ConflictBuildingItem: React.FC<ConflictBuildingItemProps> = ({ conflictBuilding, onClick }) => {
  const { building, conflictTypes } = conflictBuilding;

  return (
    <div
      onClick={onClick}
      className="p-3 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 hover:border-red-200 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-800 text-sm truncate">{building.name}</span>
            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full flex-shrink-0">
              {USAGE_LABELS[building.usage]}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{building.address}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {conflictTypes.map((type) => (
              <span
                key={type}
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: REDLINE_TYPE_COLORS[type] }}
              >
                {REDLINE_TYPE_LABELS[type]}
              </span>
            ))}
          </div>
        </div>
        <i className="fas fa-chevron-right text-gray-300 ml-2 mt-1"></i>
      </div>
    </div>
  );
};

export default ConflictAnalysisPanel;
