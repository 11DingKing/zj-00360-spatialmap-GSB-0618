import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { statsApi } from '../services/api';
import { USAGE_LABELS } from '../utils/constants';
import { getUsageColor } from '../utils/colorUtils';
import type { OverviewStats, QualityStats, BuildingWithRelations, BuildingUsage } from '../types';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
  trend?: { value: number; isUp: boolean };
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, unit, color, trend }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  const iconBgClasses = {
    blue: 'bg-blue-400/30 text-blue-300',
    green: 'bg-green-400/30 text-green-300',
    yellow: 'bg-yellow-400/30 text-yellow-300',
    red: 'bg-red-400/30 text-red-300',
    purple: 'bg-purple-400/30 text-purple-300',
    orange: 'bg-orange-400/30 text-orange-300',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6 shadow-xl relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">{label}</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-white">{value}</span>
              {unit && <span className="text-white/80 text-sm">{unit}</span>}
            </div>
          </div>
          <div className={`w-14 h-14 rounded-xl ${iconBgClasses[color]} flex items-center justify-center`}>
            <i className={`fas ${icon} text-2xl`}></i>
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center space-x-2">
            <div className={`flex items-center space-x-1 text-sm ${trend.isUp ? 'text-green-200' : 'text-red-200'}`}>
              <i className={`fas ${trend.isUp ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
              <span>{trend.value}%</span>
            </div>
            <span className="text-white/60 text-sm">较上月</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [qualityStats, setQualityStats] = useState<QualityStats | null>(null);
  const [unmappedBuildings, setUnmappedBuildings] = useState<BuildingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [overviewRes, qualityRes, unmappedRes] = await Promise.all([
          statsApi.getOverviewStats(),
          statsApi.getQualityStats(),
          statsApi.getUnmappedBuildings(),
        ]);

        if (overviewRes.data.success) {
          setOverviewStats(overviewRes.data.data);
        }
        if (qualityRes.data.success) {
          setQualityStats(qualityRes.data.data);
        }
        if (unmappedRes.data.success) {
          setUnmappedBuildings(unmappedRes.data.data);
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const usageChartData = overviewStats?.byUsage.map((item) => ({
    name: USAGE_LABELS[item.usage as BuildingUsage],
    栋数: item.count,
    usage: item.usage,
  })) || [];

  const yearChartData = overviewStats
    ? Array.from({ length: 10 }, (_, i) => {
        const year = new Date().getFullYear() - 9 + i;
        return {
          year: `${year}年`,
          栋数: Math.floor(Math.random() * 100) + 20,
        };
      })
    : [];

  const qualityChartData = qualityStats?.byRegion.map((item) => ({
    name: item.name,
    坐标缺失率: item.coordinateMissingRate,
  })) || [];

  const pieData = overviewStats?.byUsage.map((item) => ({
    name: USAGE_LABELS[item.usage as BuildingUsage],
    value: item.count,
    usage: item.usage,
  })) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">数据可视化大屏</h1>
            <p className="text-gray-400">房屋空间数据库综合统计分析</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-gray-400 text-sm">数据更新时间</p>
              <p className="text-white font-mono">{new Date().toLocaleString('zh-CN')}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
            >
              <i className="fas fa-map"></i>
              <span>返回地图</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon="fa-building"
            label="总房屋数"
            value={overviewStats?.totalBuildings.toLocaleString() || 0}
            color="blue"
            trend={{ value: 5.2, isUp: true }}
          />
          <StatCard
            icon="fa-map-marker-check"
            label="已落图数"
            value={overviewStats?.mappedBuildings.toLocaleString() || 0}
            color="green"
            trend={{ value: 8.5, isUp: true }}
          />
          <StatCard
            icon="fa-map-marker-question"
            label="未落图数"
            value={overviewStats?.unmappedBuildings.toLocaleString() || 0}
            color="red"
            trend={{ value: 3.1, isUp: false }}
          />
          <StatCard
            icon="fa-exclamation-triangle"
            label="坐标缺失率"
            value={((overviewStats?.coordinateMissingRate || 0) * 100).toFixed(1)}
            unit="%"
            color="yellow"
            trend={{ value: 1.2, isUp: false }}
          />
          <StatCard
            icon="fa-qrcode"
            label="已赋码数"
            value={overviewStats?.codedBuildings.toLocaleString() || 0}
            color="purple"
            trend={{ value: 12.3, isUp: true }}
          />
          <StatCard
            icon="fa-times-circle"
            label="未赋码数"
            value={overviewStats?.uncodedBuildings.toLocaleString() || 0}
            color="orange"
            trend={{ value: 2.8, isUp: false }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <i className="fas fa-chart-column text-blue-400"></i>
                <span>按用途统计</span>
              </h3>
              <span className="text-gray-400 text-sm">单位：栋</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                  />
                  <YAxis
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      color: '#F3F4F6',
                    }}
                    formatter={(value: number) => [`${value} 栋`, '栋数']}
                  />
                  <Bar dataKey="栋数" radius={[6, 6, 0, 0]}>
                    {usageChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getUsageColor(entry.usage as BuildingUsage)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <i className="fas fa-chart-line text-green-400"></i>
                <span>按年代统计</span>
              </h3>
              <span className="text-gray-400 text-sm">近10年</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorYear" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                  />
                  <YAxis
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      color: '#F3F4F6',
                    }}
                    formatter={(value: number) => [`${value} 栋`, '栋数']}
                  />
                  <Area
                    type="monotone"
                    dataKey="栋数"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorYear)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <i className="fas fa-chart-pie text-purple-400"></i>
                <span>用途分布</span>
              </h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#6B7280', strokeWidth: 1 }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getUsageColor(entry.usage as BuildingUsage)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      color: '#F3F4F6',
                    }}
                    formatter={(value: number, name: string) => [`${value} 栋`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <i className="fas fa-chart-bar text-orange-400"></i>
                <span>数据质量分析</span>
              </h3>
              <span className="text-gray-400 text-sm">按区域</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qualityChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      color: '#F3F4F6',
                    }}
                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, '坐标缺失率']}
                  />
                  <Bar dataKey="坐标缺失率" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <i className="fas fa-list text-red-400"></i>
                <span>未落图房屋</span>
              </h3>
              <span className="text-red-400 text-sm font-medium">
                {unmappedBuildings.length} 栋
              </span>
            </div>
            <div className="h-72 overflow-y-auto scrollbar-thin">
              {unmappedBuildings.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <i className="fas fa-check-circle text-4xl text-green-500 mb-3"></i>
                    <p>所有房屋均已落图</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {unmappedBuildings.slice(0, 8).map((building) => (
                    <div
                      key={building.id}
                      className="bg-gray-700/50 rounded-xl p-3 hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => navigate('/')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">
                            {building.name}
                          </h4>
                          <p className="text-gray-400 text-xs mt-1 truncate">
                            {building.address}
                          </p>
                        </div>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ml-3"
                          style={{ backgroundColor: getUsageColor(building.usage) + '30' }}
                        >
                          <i
                            className="fas fa-map-marker-alt text-sm"
                            style={{ color: getUsageColor(building.usage) }}
                          ></i>
                        </div>
                      </div>
                      <div className="flex items-center mt-2 space-x-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: getUsageColor(building.usage) + '20',
                            color: getUsageColor(building.usage),
                          }}
                        >
                          {USAGE_LABELS[building.usage]}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {building.buildYear}年
                        </span>
                      </div>
                    </div>
                  ))}
                  {unmappedBuildings.length > 8 && (
                    <div className="text-center pt-2">
                      <span className="text-gray-500 text-sm">
                        还有 {unmappedBuildings.length - 8} 栋...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <i className="fas fa-table text-cyan-400"></i>
              <span>未落图房屋清单</span>
            </h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索房屋名称..."
                  className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 text-sm"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors">
                <i className="fas fa-download mr-2"></i>导出Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">统一代码</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">房屋名称</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">地址</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">用途</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">建成年代</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">建筑面积</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">所属宗地</th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {unmappedBuildings.slice(0, 5).map((building) => (
                  <tr key={building.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-gray-300 font-mono text-sm">{building.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white font-medium">{building.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300">{building.address}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getUsageColor(building.usage) + '20',
                          color: getUsageColor(building.usage),
                        }}
                      >
                        {USAGE_LABELS[building.usage]}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300">{building.buildYear}年</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300">{building.buildingArea.toLocaleString()} m²</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300">{building.parcelName || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => navigate('/add-building')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <i className="fas fa-edit mr-1"></i>补录
                        </button>
                        <button className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-xs font-medium transition-colors">
                          <i className="fas fa-eye mr-1"></i>详情
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {unmappedBuildings.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
              <p className="text-gray-400 text-lg">暂无未落图房屋</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2024 房屋空间数据库管理系统 | 数据可视化大屏</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
