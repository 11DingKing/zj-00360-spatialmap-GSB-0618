import React, { useState } from 'react';
import Drawer from './Drawer';
import type { BuildingWithRelations, LifeCycleRecord } from '../types';
import { USAGE_LABELS, LIFE_CYCLE_STAGE_LABELS } from '../utils/constants';
import { formatCoordinate } from '../utils/spatialUtils';
import { getUsageColor } from '../utils/colorUtils';

interface BuildingDetailProps {
  isOpen: boolean;
  onClose: () => void;
  building: BuildingWithRelations | null;
  lifeCycleRecords?: LifeCycleRecord[];
}

type TabType = 'basic' | 'spatial' | 'lifecycle';

const BuildingDetail: React.FC<BuildingDetailProps> = ({
  isOpen,
  onClose,
  building,
  lifeCycleRecords = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  if (!building) return null;

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'basic', label: '基本信息', icon: 'fa-info-circle' },
    { key: 'spatial', label: '空间信息', icon: 'fa-map-marker-alt' },
    { key: 'lifecycle', label: '生命周期', icon: 'fa-history' },
  ];

  const lifeCycleStages = [
    { key: 'planning', icon: 'fa-drafting-compass', color: '#3B82F6' },
    { key: 'construction', icon: 'fa-hard-hat', color: '#F59E0B' },
    { key: 'acceptance', icon: 'fa-check-circle', color: '#10B981' },
    { key: 'registration', icon: 'fa-file-contract', color: '#8B5CF6' },
    { key: 'cancelled', icon: 'fa-times-circle', color: '#EF4444' },
  ];

  const getRecordByStage = (stage: string) => {
    return lifeCycleRecords.find((r) => r.stage === stage);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} position="right" width="480px">
      <div className="h-full flex flex-col">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
            <i className="fas fa-building text-blue-600"></i>
            <span>房屋详情</span>
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <i className={`fas ${tab.icon} mr-2`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                <p className="text-sm text-blue-100 mb-1">统一代码</p>
                <p className="text-2xl font-bold tracking-wider font-mono">
                  {building.id}
                </p>
                <div className="mt-3 flex items-center space-x-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: getUsageColor(building.usage) }}
                  >
                    {USAGE_LABELS[building.usage]}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      building.isCoded
                        ? 'bg-green-400 text-green-900'
                        : 'bg-yellow-400 text-yellow-900'
                    }`}
                  >
                    {building.isCoded ? '已赋码' : '未赋码'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <InfoItem icon="fa-home" label="房屋名称" value={building.name} />
                <InfoItem icon="fa-map-marker-alt" label="地址" value={building.address} />
                <InfoItem
                  icon="fa-building"
                  label="房屋用途"
                  value={USAGE_LABELS[building.usage]}
                  valueColor={getUsageColor(building.usage)}
                />
                <InfoItem icon="fa-calendar" label="建成年代" value={`${building.buildYear} 年`} />
                <InfoItem
                  icon="fa-layer-group"
                  label="层数"
                  value={`地上 ${building.floors} 层 / 地下 ${building.undergroundFloors} 层`}
                />
                <InfoItem icon="fa-ruler-combined" label="建筑面积" value={`${building.buildingArea.toLocaleString()} m²`} />
              </div>
            </div>
          )}

          {activeTab === 'spatial' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                    <i className="fas fa-crosshairs text-blue-600"></i>
                    <span>坐标信息</span>
                  </h4>
                  {building.location ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">WGS84 坐标</span>
                        <span className="font-mono text-gray-800">
                          {formatCoordinate(building.location.coordinates[0], building.location.coordinates[1])}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">经度</span>
                        <span className="font-mono text-gray-800">{building.location.coordinates[0].toFixed(8)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">纬度</span>
                        <span className="font-mono text-gray-800">{building.location.coordinates[1].toFixed(8)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">暂无坐标信息</p>
                  )}
                </div>

                <InfoItem
                  icon="fa-map"
                  label="所属宗地"
                  value={building.parcelName || '未关联'}
                  subValue={building.parcelCode}
                />
                <InfoItem
                  icon="fa-project-diagram"
                  label="所属项目"
                  value={building.projectName || '未关联'}
                />

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                    <i className="fas fa-draw-polygon text-blue-600"></i>
                    <span>轮廓预览</span>
                  </h4>
                  {building.outline ? (
                    <div className="aspect-video bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <i className="fas fa-vector-square text-4xl text-gray-300 mb-2"></i>
                        <p className="text-xs text-gray-400">轮廓数据已存在</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {building.outline.coordinates[0].length} 个顶点
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-white rounded-lg border border-gray-200 border-dashed flex items-center justify-center">
                      <div className="text-center">
                        <i className="fas fa-vector-square text-4xl text-gray-200 mb-2"></i>
                        <p className="text-xs text-gray-400">暂无轮廓数据</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lifecycle' && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                {lifeCycleStages.map((stage) => {
                  const record = getRecordByStage(stage.key);
                  const isCompleted = !!record;
                  const isCurrent = building.currentStage === stage.key;

                  return (
                    <div key={stage.key} className="relative flex items-start mb-6 last:mb-0">
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted
                            ? 'text-white shadow-lg'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                        style={isCompleted ? { backgroundColor: stage.color } : {}}
                      >
                        <i className={`fas ${stage.icon} text-sm`}></i>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`font-semibold ${
                              isCompleted ? 'text-gray-800' : 'text-gray-400'
                            }`}
                          >
                            {LIFE_CYCLE_STAGE_LABELS[stage.key as keyof typeof LIFE_CYCLE_STAGE_LABELS]}
                            {isCurrent && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                                当前阶段
                              </span>
                            )}
                          </h4>
                          {record && (
                            <span className="text-sm text-gray-500">{formatDate(record.date)}</span>
                          )}
                        </div>
                        {record ? (
                          <div className="mt-1 text-sm text-gray-600">
                            {record.operator && (
                              <p className="flex items-center space-x-1">
                                <i className="fas fa-user text-gray-400 text-xs"></i>
                                <span>{record.operator}</span>
                              </p>
                            )}
                            {record.remark && (
                              <p className="mt-1 text-gray-500">{record.remark}</p>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-gray-400">未完成</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};

interface InfoItemProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  valueColor?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, subValue, valueColor }) => (
  <div className="flex items-start space-x-3">
    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
      <i className={`fas ${icon} text-blue-600 text-sm`}></i>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className="text-gray-800 font-medium truncate"
        style={{ color: valueColor }}
      >
        {value}
      </p>
      {subValue && <p className="text-xs text-gray-400 font-mono">{subValue}</p>}
    </div>
  </div>
);

export default BuildingDetail;
