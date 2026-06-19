import React, { useEffect, useState } from "react";
import type {
  RedlineAnalysisResult,
  ConflictBuilding,
  RedlineType,
} from "../types";

interface RedlineAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  result: RedlineAnalysisResult | null;
  onBuildingClick?: (buildingId: string) => void;
}

const REDLINE_TYPE_COLORS: Record<
  RedlineType,
  { bg: string; text: string; dot: string }
> = {
  ecological: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  heritage: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  farmland: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  water: { bg: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-500" },
  infrastructure: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  other: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
};

const REDLINE_TYPE_NAMES: Record<RedlineType, string> = {
  ecological: "生态保护红线",
  heritage: "历史街区保护线",
  farmland: "永久基本农田",
  water: "河湖蓝线",
  infrastructure: "基础设施控制线",
  other: "其他管控线",
};

const RedlineAnalysisPanel: React.FC<RedlineAnalysisPanelProps> = ({
  isOpen,
  onClose,
  result,
  onBuildingClick,
}) => {
  const [selectedTab, setSelectedTab] = useState<
    "summary" | "conflicts" | "all"
  >("summary");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setSelectedTab("summary");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !result) return null;

  const nonConflictBuildings = result.totalBuildings - result.conflictCount;
  const conflictRate =
    result.totalBuildings > 0
      ? ((result.conflictCount / result.totalBuildings) * 100).toFixed(1)
      : "0.0";

  const allBuildings = result.conflictBuildings;

  const handleExport = () => {
    const exportData = {
      exportTime: new Date().toLocaleString("zh-CN"),
      summary: {
        totalBuildings: result.totalBuildings,
        conflictCount: result.conflictCount,
        conflictRate: `${conflictRate}%`,
        parcelCount: result.parcelsInArea.length,
        redlineCount: result.redlinesInArea.length,
      },
      conflictsByType: result.summaryByType.map((item) => ({
        type: item.type,
        typeName: item.typeName,
        conflictBuildings: item.count,
      })),
      conflictBuildings: result.conflictBuildings.map((cb) => ({
        id: cb.building.id,
        name: cb.building.name,
        address: cb.building.address,
        usage: cb.building.usage,
        conflicts: cb.conflictRedlineNames,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `管控线冲突体检_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-orange-600 text-lg"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  管控线冲突体检结果
                </h2>
                <p className="text-sm text-gray-500">
                  共检测 {result.totalBuildings} 栋建筑，发现{" "}
                  {result.conflictCount} 栋存在管控线冲突
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <i className="fas fa-download"></i>
                <span>导出报告</span>
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200 px-6 flex-shrink-0">
            <div className="flex space-x-1">
              {[
                { key: "summary", label: "概览", icon: "fa-chart-pie" },
                {
                  key: "conflicts",
                  label: `冲突建筑 (${result.conflictCount})`,
                  icon: "fa-exclamation-circle",
                },
                {
                  key: "all",
                  label: `区域内建筑 (${result.totalBuildings})`,
                  icon: "fa-buildings",
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                    selectedTab === tab.key
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <i className={`fas ${tab.icon}`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {selectedTab === "summary" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon="fa-building"
                    label="区域内建筑"
                    value={result.totalBuildings.toString()}
                    color="blue"
                  />
                  <StatCard
                    icon="fa-exclamation-triangle"
                    label="冲突建筑"
                    value={result.conflictCount.toString()}
                    color={result.conflictCount > 0 ? "red" : "green"}
                  />
                  <StatCard
                    icon="fa-map"
                    label="涉及地块"
                    value={result.parcelsInArea.length.toString()}
                    color="purple"
                  />
                  <StatCard
                    icon="fa-shield-alt"
                    label="管控线"
                    value={result.redlinesInArea.length.toString()}
                    color="orange"
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                    <i className="fas fa-chart-bar text-orange-600"></i>
                    <span>各类型管控线冲突统计</span>
                  </h3>
                  {result.summaryByType.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-check-circle text-green-500 text-2xl"></i>
                      </div>
                      <p className="text-gray-600 font-medium">
                        未发现管控线冲突
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        所选区域内的建筑均符合管控线要求
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {result.summaryByType.map((item) => {
                        const colors = REDLINE_TYPE_COLORS[item.type];
                        return (
                          <div
                            key={item.type}
                            className="flex items-center space-x-4"
                          >
                            <div className="flex items-center space-x-2 w-48 flex-shrink-0">
                              <div
                                className={`w-3 h-3 rounded-full ${colors.dot}`}
                              ></div>
                              <span className="text-sm text-gray-700">
                                {item.typeName}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${colors.dot}`}
                                  style={{
                                    width: `${(item.count / Math.max(...result.summaryByType.map((s) => s.count))) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-gray-800 w-12 text-right">
                              {item.count} 栋
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                      <i className="fas fa-info-circle text-blue-600"></i>
                      <span>区域信息</span>
                    </h3>
                    <div className="space-y-3">
                      <InfoRow
                        label="总建筑数"
                        value={`${result.totalBuildings} 栋`}
                      />
                      <InfoRow
                        label="有冲突"
                        value={`${result.conflictCount} 栋 (${conflictRate}%)`}
                        valueClass={
                          result.conflictCount > 0
                            ? "text-red-600 font-semibold"
                            : "text-green-600 font-semibold"
                        }
                      />
                      <InfoRow
                        label="无冲突"
                        value={`${nonConflictBuildings} 栋`}
                        valueClass="text-green-600"
                      />
                      <InfoRow
                        label="涉及地块"
                        value={`${result.parcelsInArea.length} 个`}
                      />
                      <InfoRow
                        label="涉及管控线"
                        value={`${result.redlinesInArea.length} 条`}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                      <i className="fas fa-shield-alt text-orange-600"></i>
                      <span>管控线类型说明</span>
                    </h3>
                    <div className="space-y-2">
                      {(Object.keys(REDLINE_TYPE_NAMES) as RedlineType[]).map(
                        (type) => {
                          const colors = REDLINE_TYPE_COLORS[type];
                          return (
                            <div
                              key={type}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${colors.dot}`}
                              ></div>
                              <span className="text-gray-600">
                                {REDLINE_TYPE_NAMES[type]}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === "conflicts" && (
              <div>
                {result.conflictBuildings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-check-circle text-green-500 text-3xl"></i>
                    </div>
                    <p className="text-gray-600 font-medium text-lg">
                      恭喜，未发现管控线冲突！
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      所选区域内的建筑均符合管控线要求
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {result.conflictBuildings.map((cb) => (
                      <ConflictBuildingCard
                        key={cb.building.id}
                        conflict={cb}
                        onClick={() => onBuildingClick?.(cb.building.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === "all" && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">
                          建筑名称
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">
                          地址
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">
                          所属地块
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">
                          状态
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allBuildings.map((cb) => {
                        const hasConflict = cb.conflictRedlineIds.length > 0;
                        return (
                          <tr
                            key={cb.building.id}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => onBuildingClick?.(cb.building.id)}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <i className="fas fa-building text-gray-400"></i>
                                <span className="text-gray-800 font-medium">
                                  {cb.building.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {cb.building.address}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {cb.building.parcelName || "-"}
                            </td>
                            <td className="py-3 px-4">
                              {hasConflict ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <i className="fas fa-exclamation-circle"></i>
                                  <span>
                                    冲突 ({cb.conflictRedlineTypes.length}类)
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <i className="fas fa-check-circle"></i>
                                  <span>正常</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {Array.from({
                        length: Math.max(0, 10 - allBuildings.length),
                      }).map((_, i) => (
                        <tr
                          key={`empty-${i}`}
                          className="border-b border-gray-100"
                        >
                          <td colSpan={4} className="py-3 px-4">
                            &nbsp;
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  color: "blue" | "green" | "orange" | "purple" | "red";
}> = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
        >
          <i className={`fas ${icon}`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 truncate">{label}</p>
          <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{
  label: string;
  value: string;
  valueClass?: string;
}> = ({ label, value, valueClass = "text-gray-800" }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-sm ${valueClass}`}>{value}</span>
  </div>
);

const ConflictBuildingCard: React.FC<{
  conflict: ConflictBuilding;
  onClick?: () => void;
}> = ({ conflict, onClick }) => {
  return (
    <div
      className="bg-white border border-red-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <i className="fas fa-building text-gray-400"></i>
            <h4 className="font-semibold text-gray-800">
              {conflict.building.name}
            </h4>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              冲突
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            <i className="fas fa-map-marker-alt mr-1"></i>
            {conflict.building.address}
            {conflict.building.parcelName && (
              <span className="ml-2 text-gray-400">
                | {conflict.building.parcelName}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {conflict.conflictRedlineTypes.map((type, idx) => {
              const colors = REDLINE_TYPE_COLORS[type];
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}
                  ></div>
                  <span>{REDLINE_TYPE_NAMES[type]}</span>
                </span>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            涉及管控线: {conflict.conflictRedlineNames.join("、")}
          </p>
        </div>
        <i className="fas fa-chevron-right text-gray-300 mt-2"></i>
      </div>
    </div>
  );
};

export default RedlineAnalysisPanel;
