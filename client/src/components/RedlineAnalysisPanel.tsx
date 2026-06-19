import React, { useState } from 'react';
import type { AnalysisResult, BuildingWithConflicts } from '../types';
import { REDLINE_TYPE_COLORS, REDLINE_TYPE_NAMES } from '../types';

interface RedlineAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
}

const RedlineAnalysisPanel: React.FC<RedlineAnalysisPanelProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'conflicts' | 'buildings' | 'parcels'>('summary');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingWithConflicts | null>(null);

  if (!isOpen || !result) return null;

  const conflictBuildings = result.buildings.filter(b => b.hasConflict);

  return (
    <div className="absolute top-4 left-80 z-30 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fas fa-shield-alt text-white text-xl"></i>
            <div>
              <h3 className="text-white font-bold text-lg">管控线冲突体检</h3>
              <p className="text-white/80 text-sm">分析结果报告</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        <div className="px-4 py-3 text-center">
          <div className="text-2xl font-bold text-gray-800">{result.totalBuildings}</div>
          <div className="text-xs text-gray-500">建筑物</div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="text-2xl font-bold text-red-500">{conflictBuildings.length}</div>
          <div className="text-xs text-gray-500">冲突建筑</div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="text-2xl font-bold text-blue-500">{result.totalParcels}</div>
          <div className="text-xs text-gray-500">地块</div>
        </div>
      </div>

      <div className="flex border-b border-gray-100">
        {[
          { key: 'summary', label: '汇总', icon: 'fa-chart-pie' },
          { key: 'conflicts', label: '冲突', icon: 'fa-exclamation-triangle' },
          { key: 'buildings', label: '建筑', icon: 'fa-building' },
          { key: 'parcels', label: '地块', icon: 'fa-map' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-orange-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className={`fas ${tab.icon} mr-1.5`}></i>
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 text-sm">冲突类型分布</h4>
            {result.conflictSummary.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check-circle text-green-500 text-3xl"></i>
                </div>
                <p className="text-gray-500">未发现管控线冲突</p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.conflictSummary.map(summary => (
                  <div key={summary.type} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: REDLINE_TYPE_COLORS[summary.type] }}
                        ></div>
                        <span className="font-medium text-gray-700 text-sm">
                          {summary.typeName}
                        </span>
                      </div>
                      <span className="font-bold text-gray-800">{summary.count} 处</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(summary.count / conflictBuildings.length) * 100}%`,
                          backgroundColor: REDLINE_TYPE_COLORS[summary.type],
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'conflicts' && (
          <div className="space-y-3">
            {conflictBuildings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-check-circle text-green-500 text-3xl mb-3"></i>
                <p>无冲突建筑</p>
              </div>
            ) : (
              conflictBuildings.map(building => (
                <div
                  key={building.id}
                  className="bg-red-50 border border-red-100 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedBuilding(building)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-gray-800">{building.name}</h5>
                      <p className="text-xs text-gray-500 mt-1">{building.address}</p>
                    </div>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-lg">
                      {building.conflicts.length} 项冲突
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {building.conflicts.map((conflict, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-xs px-2 py-1 rounded-lg text-white"
                        style={{ backgroundColor: REDLINE_TYPE_COLORS[conflict.redlineType] }}
                      >
                        <i className="fas fa-exclamation-circle mr-1"></i>
                        {conflict.redlineName}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'buildings' && (
          <div className="space-y-2">
            {result.buildings.map(building => (
              <div
                key={building.id}
                className={`rounded-xl p-3 border ${
                  building.hasConflict
                    ? 'bg-red-50 border-red-100'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-800 text-sm">{building.name}</h5>
                    <p className="text-xs text-gray-500">
                      {building.address} · {building.floors}层
                    </p>
                  </div>
                  {building.hasConflict && (
                    <i className="fas fa-exclamation-triangle text-red-500"></i>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'parcels' && (
          <div className="space-y-2">
            {result.parcels.map(parcel => (
              <div key={parcel.id} className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h5 className="font-semibold text-gray-800">{parcel.name}</h5>
                <p className="text-xs text-gray-500 mt-1">
                  地块编号: {parcel.code}
                </p>
                <p className="text-xs text-gray-500">
                  面积: {(parcel.area / 10000).toFixed(2)} 公顷
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedBuilding && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-700 text-sm">冲突详情 - {selectedBuilding.name}</h4>
            <button
              onClick={() => setSelectedBuilding(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="space-y-2">
            {selectedBuilding.conflicts.map((conflict, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-sm">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: REDLINE_TYPE_COLORS[conflict.redlineType] }}
                ></div>
                <span className="text-gray-600">{REDLINE_TYPE_NAMES[conflict.redlineType]}:</span>
                <span className="font-medium text-gray-800">{conflict.redlineName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RedlineAnalysisPanel;
