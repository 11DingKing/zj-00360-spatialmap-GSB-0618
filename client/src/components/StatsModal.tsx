import React, { useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { StatsResult } from '../types';
import { USAGE_LABELS } from '../utils/constants';
import { getUsageColor } from '../utils/colorUtils';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StatsResult | null;
  onExport?: () => void;
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, stats, onExport }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !stats) return null;

  const pieData = stats.byUsage.map((item) => ({
    name: USAGE_LABELS[item.usage],
    value: item.count,
    percentage: item.percentage,
    usage: item.usage,
  }));

  const barData = stats.byYear.map((item) => ({
    year: `${item.year}年`,
    栋数: item.count,
  }));

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }
    const exportData = {
      exportTime: new Date().toLocaleString('zh-CN'),
      totalCount: stats.totalCount,
      byUsage: stats.byUsage.map((item) => ({
        用途: USAGE_LABELS[item.usage],
        栋数: item.count,
        占比: `${item.percentage.toFixed(1)}%`,
      })),
      byYear: stats.byYear.map((item) => ({
        年份: item.year,
        栋数: item.count,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `框选统计_${new Date().toISOString().slice(0, 10)}.json`;
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-fadeIn pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <i className="fas fa-chart-bar text-blue-600 text-lg"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">框选统计结果</h2>
                <p className="text-sm text-gray-500">基于当前地图框选范围的统计数据</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <i className="fas fa-download"></i>
                <span>导出数据</span>
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon="fa-building"
                label="总栋数"
                value={stats.totalCount.toLocaleString()}
                color="blue"
              />
              {stats.byUsage.slice(0, 3).map((item) => (
                <StatCard
                  key={item.usage}
                  icon="fa-home"
                  label={USAGE_LABELS[item.usage]}
                  value={`${item.count} (${item.percentage.toFixed(1)}%)`}
                  color="green"
                />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                  <i className="fas fa-chart-pie text-blue-600"></i>
                  <span>各用途占比</span>
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                        labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getUsageColor(entry.usage)}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          `${value} 栋 (${props.payload.percentage.toFixed(1)}%)`,
                          name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                  <i className="fas fa-chart-column text-blue-600"></i>
                  <span>按年代分布</span>
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={{ stroke: '#D1D5DB' }}
                      />
                      <YAxis
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={{ stroke: '#D1D5DB' }}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value} 栋`, '栋数']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar
                        dataKey="栋数"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                <i className="fas fa-table text-blue-600"></i>
                <span>详细数据</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">用途</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">栋数</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">占比</th>
                      <th className="w-24 py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byUsage.map((item) => (
                      <tr key={item.usage} className="border-b border-gray-100 hover:bg-white">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getUsageColor(item.usage) }}
                            ></div>
                            <span className="text-gray-800">{USAGE_LABELS[item.usage]}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-800">
                          {item.count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${item.percentage}%`,
                                  backgroundColor: getUsageColor(item.usage),
                                }}
                              ></div>
                            </div>
                            <span className="text-gray-600 w-16 text-right">
                              {item.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
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

export default StatsModal;
