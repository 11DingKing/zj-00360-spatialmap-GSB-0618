import React from "react";
import type { AreaAnalysisResult } from "../types";
import {
  REDLINE_TYPE_LABELS,
  REDLINE_TYPE_COLORS,
  USAGE_LABELS,
} from "../utils/constants";

interface AnalysisPanelProps {
  isOpen: boolean;
  loading: boolean;
  result: AreaAnalysisResult | null;
  onClose: () => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  isOpen,
  loading,
  result,
  onClose,
}) => {
  if (!isOpen) return null;

  const conflictBuildingIds = new Set(
    result?.conflicts.map((c) => c.buildingId) ?? [],
  );

  return (
    <div className="absolute top-4 right-4 z-30 w-96 max-h-[calc(100vh-2rem)] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <div className="px-5 py-4 bg-red-500 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <i className="fas fa-shield-alt"></i>
          <h3 className="font-semibold">管控线冲突体检</h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
          title="关闭"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent" />
            <span className="ml-3 text-gray-600">分析中...</span>
          </div>
        )}

        {!loading && result && (
          <>
            <section>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                区域概览
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">建筑物</div>
                  <div className="text-xl font-bold text-gray-800">
                    {result.buildings.length}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">地块</div>
                  <div className="text-xl font-bold text-gray-800">
                    {result.parcels.length}
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-red-500">压线建筑</div>
                  <div className="text-xl font-bold text-red-600">
                    {result.conflicts.length}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                圈选面积:{" "}
                {result.area.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                m²
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                冲突汇总（按管控线类型）
              </h4>
              {result.conflictSummary.length === 0 ? (
                <div className="bg-green-50 text-green-700 rounded-lg p-3 text-sm flex items-center space-x-2">
                  <i className="fas fa-check-circle"></i>
                  <span>未检测到压线建筑</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {result.conflictSummary.map((s) => (
                    <div
                      key={s.type}
                      className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-sm"
                          style={{
                            backgroundColor: REDLINE_TYPE_COLORS[s.type],
                          }}
                        />
                        <span className="text-sm text-gray-800">
                          {REDLINE_TYPE_LABELS[s.type]}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        管控线{" "}
                        <span className="font-semibold text-gray-800">
                          {s.redlineCount}
                        </span>
                        ，压线建筑{" "}
                        <span className="font-semibold text-red-600">
                          {s.conflictBuildingCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {result.redlines.length > 0 && (
              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  涉及管控线（{result.redlines.length}）
                </h4>
                <div className="space-y-1">
                  {result.redlines.map((r) => (
                    <div
                      key={r.id}
                      className="text-xs text-gray-600 flex items-center space-x-2"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: REDLINE_TYPE_COLORS[r.type] }}
                      />
                      <span className="font-medium text-gray-800">
                        {r.name}
                      </span>
                      <span className="text-gray-400">
                        {REDLINE_TYPE_LABELS[r.type]}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {result.buildings.length > 0 && (
              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  区域内建筑（{result.buildings.length}）
                </h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {result.buildings.map((b) => {
                    const isConflict = conflictBuildingIds.has(b.id);
                    return (
                      <div
                        key={b.id}
                        className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between ${
                          isConflict
                            ? "bg-red-50 border border-red-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-800 truncate">
                            {b.name}
                          </div>
                          <div className="text-gray-500 truncate">
                            {USAGE_LABELS[b.usage]} · {b.buildYear}年
                          </div>
                        </div>
                        {isConflict && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-medium whitespace-nowrap">
                            <i className="fas fa-exclamation-triangle mr-1"></i>
                            压线
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {result.parcels.length > 0 && (
              <section>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  涉及地块（{result.parcels.length}）
                </h4>
                <div className="space-y-1">
                  {result.parcels.map((p) => (
                    <div key={p.id} className="text-xs text-gray-600">
                      <span className="font-medium text-gray-800">
                        {p.name}
                      </span>
                      <span className="text-gray-400 ml-2">{p.code}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;
