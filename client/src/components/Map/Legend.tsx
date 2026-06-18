import React from 'react';
import { useFilter } from '../../context/FilterContext';
import { USAGE_COLORS, USAGE_LABELS, YEAR_COLOR_RANGES } from '../../utils/constants';
import type { BuildingUsage } from '../../types';

const Legend: React.FC = () => {
  const { state, setColorMode } = useFilter();
  const { colorMode } = state;

  const usageTypes: BuildingUsage[] = ['residential', 'commercial', 'industrial', 'public', 'other'];

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white rounded-xl shadow-lg p-4 min-w-64">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
          <i className="fas fa-palette text-blue-600"></i>
          <span>图例</span>
        </h3>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setColorMode('usage')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              colorMode === 'usage'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            用途
          </button>
          <button
            onClick={() => setColorMode('year')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              colorMode === 'year'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            年代
          </button>
        </div>
      </div>

      {colorMode === 'usage' && (
        <div className="space-y-2">
          {usageTypes.map((usage) => (
            <div key={usage} className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded shadow-sm"
                style={{ backgroundColor: USAGE_COLORS[usage] }}
              />
              <span className="text-sm text-gray-700">
                {USAGE_LABELS[usage]}
              </span>
            </div>
          ))}
        </div>
      )}

      {colorMode === 'year' && (
        <div className="space-y-3">
          <div className="relative">
            <div
              className="h-4 rounded-lg shadow-sm"
              style={{
                background: `linear-gradient(to right, ${YEAR_COLOR_RANGES.map((r) => r.color).join(', ')})`,
              }}
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{YEAR_COLOR_RANGES[0].min}年</span>
              <span>{YEAR_COLOR_RANGES[Math.floor(YEAR_COLOR_RANGES.length / 2)].min}年</span>
              <span>{YEAR_COLOR_RANGES[YEAR_COLOR_RANGES.length - 1].max}年</span>
            </div>
          </div>
          
          <div className="space-y-1 pt-2 border-t border-gray-100">
            {YEAR_COLOR_RANGES.map((range, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: range.color }}
                />
                <span className="text-xs text-gray-600">
                  {range.min} - {range.max}年
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Legend;
