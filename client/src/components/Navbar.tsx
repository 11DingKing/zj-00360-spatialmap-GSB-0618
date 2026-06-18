import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFilter, ColorMode } from '../context/FilterContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { state, setColorMode } = useFilter();

  const navLinks = [
    { path: '/', label: '地图查询', icon: 'fa-map-marked-alt' },
    { path: '/add', label: '新增房屋', icon: 'fa-plus-circle' },
    { path: '/dashboard', label: '统计看板', icon: 'fa-chart-pie' },
  ];

  const colorModes: { mode: ColorMode; label: string; icon: string }[] = [
    { mode: 'usage', label: '按用途着色', icon: 'fa-palette' },
    { mode: 'year', label: '按年代着色', icon: 'fa-clock' },
  ];

  return (
    <nav className="h-16 shadow-lg z-20" style={{ backgroundColor: '#1e3a5f' }}>
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-3">
            <i className="fas fa-building text-white text-2xl"></i>
            <span className="text-white text-xl font-bold tracking-wide">
              房屋落图查询系统
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                location.pathname === link.path
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <i className={`fas ${link.icon}`}></i>
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-white/10 rounded-lg p-1 flex">
            {colorModes.map((mode) => (
              <button
                key={mode.mode}
                onClick={() => setColorMode(mode.mode)}
                className={`px-3 py-1.5 rounded-md flex items-center space-x-2 transition-all duration-200 ${
                  state.colorMode === mode.mode
                    ? 'bg-white text-gray-800 shadow'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <i className={`fas ${mode.icon} text-sm`}></i>
                <span className="text-sm font-medium">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
