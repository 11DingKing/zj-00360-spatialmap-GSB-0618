import React from 'react';
import { useFilter } from '../context/FilterContext';
import type { BuildingUsage } from '../types';
import { USAGE_LABELS, MIN_BUILD_YEAR, MAX_BUILD_YEAR } from '../utils/constants';
import { getUsageColor } from '../utils/colorUtils';

const FilterPanel: React.FC = () => {
  const { state, toggleUsage, setYearStart, setYearEnd, setIsCoded, reset } = useFilter();

  const usageOptions: { value: BuildingUsage; label: string; icon: string }[] = [
    { value: 'residential', label: USAGE_LABELS.residential, icon: 'fa-home' },
    { value: 'commercial', label: USAGE_LABELS.commercial, icon: 'fa-shopping-cart' },
    { value: 'industrial', label: USAGE_LABELS.industrial, icon: 'fa-industry' },
    { value: 'public', label: USAGE_LABELS.public, icon: 'fa-university' },
    { value: 'other', label: USAGE_LABELS.other, icon: 'fa-ellipsis-h' },
  ];

  const codedOptions = [
    { value: null, label: '全部' },
    { value: true, label: '已赋码' },
    { value: false, label: '未赋码' },
  ];

  return (
    <div
      className="h-full overflow-y-auto scrollbar-thin shadow-lg"
      style={{
        width: '280px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
            <i className="fas fa-filter text-blue-600"></i>
            <span>筛选条件</span>
          </h2>
          <button
            onClick={reset}
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center space-x-1"
          >
            <i className="fas fa-redo text-xs"></i>
            <span>重置</span>
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
            <i className="fas fa-building text-gray-500"></i>
            <span>房屋用途</span>
          </h3>
          <div className="space-y-2">
            {usageOptions.map((option) => {
              const isChecked = state.usage.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleUsage(option.value)}
                    className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500"
                    style={{ accentColor: getUsageColor(option.value) }}
                  />
                  <i
                    className={`fas ${option.icon} text-sm`}
                    style={{ color: getUsageColor(option.value) }}
                  ></i>
                  <span className="text-gray-700 text-sm">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
            <i className="fas fa-calendar-alt text-gray-500"></i>
            <span>建成年代</span>
          </h3>
          <div className="px-2">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{state.yearStart} 年</span>
              <span>{state.yearEnd} 年</span>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full mb-4">
              <div
                className="absolute h-full bg-blue-500 rounded-full"
                style={{
                  left: `${((state.yearStart - MIN_BUILD_YEAR) / (MAX_BUILD_YEAR - MIN_BUILD_YEAR)) * 100}%`,
                  right: `${100 - ((state.yearEnd - MIN_BUILD_YEAR) / (MAX_BUILD_YEAR - MIN_BUILD_YEAR)) * 100}%`,
                }}
              ></div>
              <input
                type="range"
                min={MIN_BUILD_YEAR}
                max={MAX_BUILD_YEAR}
                value={state.yearStart}
                onChange={(e) => setYearStart(Math.min(parseInt(e.target.value), state.yearEnd))}
                className="absolute w-full h-full opacity-0 cursor-pointer"
              />
              <input
                type="range"
                min={MIN_BUILD_YEAR}
                max={MAX_BUILD_YEAR}
                value={state.yearEnd}
                onChange={(e) => setYearEnd(Math.max(parseInt(e.target.value), state.yearStart))}
                className="absolute w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{MIN_BUILD_YEAR}</span>
              <span>{MAX_BUILD_YEAR}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
            <i className="fas fa-barcode text-gray-500"></i>
            <span>赋码状态</span>
          </h3>
          <div className="flex space-x-2">
            {codedOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => setIsCoded(option.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  state.isCoded === option.value
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p className="flex items-center space-x-2">
              <i className="fas fa-info-circle text-blue-500"></i>
              <span>筛选条件变化时自动刷新地图</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
