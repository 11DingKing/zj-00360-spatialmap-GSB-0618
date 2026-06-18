import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { parcelApi, projectApi, buildingApi } from '../services/api';
import { useBuildings } from '../context/BuildingContext';
import { USAGE_LABELS, LIFE_CYCLE_STAGE_LABELS, MIN_BUILD_YEAR, MAX_BUILD_YEAR } from '../utils/constants';
import { getUsageColor } from '../utils/colorUtils';
import { formatCoordinate } from '../utils/spatialUtils';
import type { Parcel, Project, BuildingUsage, LifeCycleStage, ValidationError, Point, Polygon } from '../types';

type Step = 'location' | 'outline' | 'info';

interface FormData {
  id: string;
  name: string;
  address: string;
  usage: BuildingUsage;
  buildYear: number;
  floors: number;
  undergroundFloors: number;
  buildingArea: number;
  parcelId: string;
  projectId: string;
  isCoded: boolean;
  currentStage: LifeCycleStage;
}

const initialFormData: FormData = {
  id: '',
  name: '',
  address: '',
  usage: 'residential',
  buildYear: new Date().getFullYear(),
  floors: 1,
  undergroundFloors: 0,
  buildingArea: 0,
  parcelId: '',
  projectId: '',
  isCoded: false,
  currentStage: 'construction',
};

const AddBuilding: React.FC = () => {
  const navigate = useNavigate();
  const { createBuilding } = useBuildings();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const centerMarkerRef = useRef<L.CircleMarker | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<L.CircleMarker[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  const stepRef = useRef<Step>('location');
  const centerRef = useRef<[number, number] | null>(null);
  const polygonPointsRef = useRef<[number, number][]>([]);
  const formDataRef = useRef<FormData>(initialFormData);
  
  const [step, setStep] = useState<Step>('location');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  useEffect(() => {
    polygonPointsRef.current = polygonPoints;
  }, [polygonPoints]);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [39.93, 116.45],
      zoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const currentStep = stepRef.current;
      
      if (currentStep === 'location') {
        handleLocationSelect(lat, lng);
      } else if (currentStep === 'outline' && centerRef.current) {
        handleOutlinePointAdd(lat, lng);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const updateCenterMarker = useCallback((lat: number, lng: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (centerMarkerRef.current) {
      map.removeLayer(centerMarkerRef.current);
    }

    centerMarkerRef.current = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: '#EF4444',
      color: '#FFFFFF',
      weight: 3,
      fillOpacity: 1,
    }).addTo(map);

    centerMarkerRef.current.bindTooltip(`中心点<br/>${formatCoordinate(lng, lat)}`, {
      permanent: true,
      offset: [0, -15],
    });

    map.panTo([lat, lng]);
  }, []);

  const updatePolygonPreview = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    vertexMarkersRef.current.forEach((m) => map.removeLayer(m));
    vertexMarkersRef.current = [];

    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    const points = polygonPointsRef.current;
    if (points.length > 0) {
      points.forEach((point, index) => {
        const marker = L.circleMarker([point[0], point[1]], {
          radius: 6,
          fillColor: '#3B82F6',
          color: '#FFFFFF',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map);
        marker.bindTooltip(`顶点 ${index + 1}`, { permanent: true, offset: [0, -10] });
        vertexMarkersRef.current.push(marker);
      });
    }

    if (points.length >= 3) {
      polygonRef.current = L.polygon(points, {
        color: '#10B981',
        weight: 3,
        fillColor: '#10B981',
        fillOpacity: 0.3,
      }).addTo(map);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [parcelsRes, projectsRes] = await Promise.all([
          parcelApi.getParcels(),
          projectApi.getProjects(),
        ]);
        if (parcelsRes.data.success) {
          setParcels(parcelsRes.data.data);
        }
        if (projectsRes.data.success) {
          setProjects(projectsRes.data.data);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const validateBuilding = useCallback(async () => {
    const currentCenter = centerRef.current;
    const currentPoints = polygonPointsRef.current;
    const currentParcelId = formDataRef.current.parcelId;

    if (!currentCenter || currentPoints.length < 3 || !currentParcelId) {
      setValidationErrors([]);
      return;
    }

    try {
      const location: Point = {
        type: 'Point',
        coordinates: [currentCenter[1], currentCenter[0]],
      };

      const outline: Polygon = {
        type: 'Polygon',
        coordinates: [[...currentPoints, currentPoints[0]].map(([lat, lng]) => [lng, lat])],
      };

      const response = await buildingApi.validateBuilding({
        location,
        outline,
        parcelId: currentParcelId,
      });

      if (response.data.success) {
        setValidationErrors(response.data.data.errors);
      }
    } catch (error) {
      console.error('验证失败:', error);
    }
  }, []);

  useEffect(() => {
    validateBuilding();
  }, [validateBuilding]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setCenter([lat, lng]);
    setPolygonPoints([]);
    updateCenterMarker(lat, lng);
  };

  const handleOutlinePointAdd = (lat: number, lng: number) => {
    const newPoints = [...polygonPoints, [lat, lng] as [number, number]];
    setPolygonPoints(newPoints);
    polygonPointsRef.current = newPoints;
    updatePolygonPreview();
    validateBuilding();
  };

  const canProceedToNext = useCallback(() => {
    switch (step) {
      case 'location':
        return center !== null;
      case 'outline':
        return polygonPoints.length >= 3 && validationErrors.length === 0;
      case 'info':
        return (
          formData.id.trim() !== '' &&
          formData.name.trim() !== '' &&
          formData.address.trim() !== '' &&
          formData.parcelId !== '' &&
          formData.projectId !== '' &&
          formData.buildingArea > 0 &&
          validationErrors.length === 0
        );
      default:
        return false;
    }
  }, [step, center, polygonPoints, formData, validationErrors]);

  const handleNext = () => {
    if (step === 'location') {
      setStep('outline');
    } else if (step === 'outline') {
      setStep('info');
    }
  };

  const handlePrev = () => {
    if (step === 'outline') {
      setStep('location');
    } else if (step === 'info') {
      setStep('outline');
    }
  };

  const handleSubmit = async () => {
    if (!canProceedToNext() || !center) return;

    setSubmitting(true);
    try {
      const location: Point = {
        type: 'Point',
        coordinates: [center[1], center[0]],
      };

      const outline: Polygon = {
        type: 'Polygon',
        coordinates: [[...polygonPoints, polygonPoints[0]].map(([lat, lng]) => [lng, lat])],
      };

      const buildingData = {
        ...formData,
        location,
        outline,
      };

      const result = await createBuilding(buildingData);
      if (result) {
        alert('房屋创建成功！');
        navigate('/');
      } else {
        alert('创建失败，请重试');
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('创建失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearOutline = () => {
    setPolygonPoints([]);
    polygonPointsRef.current = [];
    updatePolygonPreview();
    setValidationErrors([]);
  };

  const handleUndoPoint = () => {
    if (polygonPoints.length > 0) {
      const newPoints = polygonPoints.slice(0, -1);
      setPolygonPoints(newPoints);
      polygonPointsRef.current = newPoints;
      updatePolygonPreview();
      validateBuilding();
    }
  };

  const steps: { key: Step; label: string; icon: string }[] = [
    { key: 'location', label: '选择位置', icon: 'fa-map-marker-alt' },
    { key: 'outline', label: '勾画轮廓', icon: 'fa-draw-polygon' },
    { key: 'info', label: '填写信息', icon: 'fa-file-alt' },
  ];

  const usageOptions: BuildingUsage[] = ['residential', 'commercial', 'industrial', 'public', 'other'];
  const stageOptions: LifeCycleStage[] = ['planning', 'construction', 'acceptance', 'registration', 'cancelled'];

  const getStepHint = () => {
    switch (step) {
      case 'location':
        return { icon: 'fa-mouse-pointer', color: 'text-blue-500', text: '点击地图选择中心点' };
      case 'outline':
        return { icon: 'fa-draw-polygon', color: 'text-green-500', text: '点击地图添加顶点' };
      case 'info':
        return { icon: 'fa-file-alt', color: 'text-purple-500', text: '请填写房屋信息' };
    }
  };

  const hint = getStepHint();

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-96 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              <span>返回地图</span>
            </button>
            <h1 className="text-lg font-bold text-gray-800">新增房屋</h1>
            <div className="w-20"></div>
          </div>

          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      step === s.key
                        ? 'bg-blue-500 text-white shadow-lg'
                        : steps.findIndex((x) => x.key === step) > index
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {steps.findIndex((x) => x.key === step) > index ? (
                      <i className="fas fa-check text-sm"></i>
                    ) : (
                      <i className={`fas ${s.icon} text-sm`}></i>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      step === s.key ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      steps.findIndex((x) => x.key === step) > index
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {step === 'location' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-1">操作提示</h4>
                        <p className="text-sm text-blue-600">
                          在右侧地图上点击选择房屋的中心点位置
                        </p>
                      </div>
                    </div>
                  </div>

                  {center && (
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="font-semibold text-green-800 mb-2">已选择位置</h4>
                      <p className="text-sm text-green-600 font-mono">
                        {formatCoordinate(center[1], center[0])}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === 'outline' && (
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <i className="fas fa-info-circle text-green-500 mt-0.5"></i>
                      <div>
                        <h4 className="font-semibold text-green-800 mb-1">操作提示</h4>
                        <p className="text-sm text-green-600">
                          在右侧地图上依次点击添加多边形顶点，勾画房屋轮廓
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">顶点数量</h4>
                      <span className="text-2xl font-bold text-blue-600">
                        {polygonPoints.length}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUndoPoint}
                        disabled={polygonPoints.length === 0}
                        className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                      >
                        <i className="fas fa-undo mr-2"></i>撤销
                      </button>
                      <button
                        onClick={handleClearOutline}
                        disabled={polygonPoints.length === 0}
                        className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                      >
                        <i className="fas fa-eraser mr-2"></i>清除
                      </button>
                    </div>
                  </div>

                  {polygonPoints.length < 3 && (
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <i className="fas fa-exclamation-triangle text-yellow-500 mt-0.5"></i>
                        <p className="text-sm text-yellow-700">
                          至少需要 3 个顶点才能形成多边形
                        </p>
                      </div>
                    </div>
                  )}

                  {validationErrors.length > 0 && (
                    <div className="bg-red-50 rounded-xl p-4">
                      <h4 className="font-semibold text-red-800 mb-2">校验错误</h4>
                      <ul className="space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600 flex items-start space-x-2">
                            <i className="fas fa-times-circle mt-0.5"></i>
                            <span>{error.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {polygonPoints.length >= 3 && validationErrors.length === 0 && (
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-check-circle text-green-500"></i>
                        <span className="text-sm text-green-700 font-medium">
                          轮廓绘制完成，校验通过
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 'info' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-barcode mr-2 text-blue-500"></i>统一代码
                    </label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      placeholder="请输入统一代码"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-home mr-2 text-blue-500"></i>房屋名称
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="请输入房屋名称"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-map-marker-alt mr-2 text-blue-500"></i>地址
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="请输入地址"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-building mr-2 text-blue-500"></i>房屋用途
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {usageOptions.map((usage) => (
                        <button
                          key={usage}
                          onClick={() => setFormData({ ...formData, usage })}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            formData.usage === usage
                              ? 'text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          style={
                            formData.usage === usage
                              ? { backgroundColor: getUsageColor(usage) }
                              : {}
                          }
                        >
                          {USAGE_LABELS[usage]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="fas fa-calendar mr-2 text-blue-500"></i>建成年代
                      </label>
                      <input
                        type="number"
                        min={MIN_BUILD_YEAR}
                        max={MAX_BUILD_YEAR}
                        value={formData.buildYear}
                        onChange={(e) => setFormData({ ...formData, buildYear: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="fas fa-ruler-combined mr-2 text-blue-500"></i>建筑面积
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          value={formData.buildingArea}
                          onChange={(e) => setFormData({ ...formData, buildingArea: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                          m²
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="fas fa-layer-group mr-2 text-blue-500"></i>地上层数
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.floors}
                        onChange={(e) => setFormData({ ...formData, floors: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="fas fa-arrow-down mr-2 text-blue-500"></i>地下层数
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.undergroundFloors}
                        onChange={(e) => setFormData({ ...formData, undergroundFloors: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-map mr-2 text-blue-500"></i>所属宗地
                    </label>
                    <select
                      value={formData.parcelId}
                      onChange={(e) => {
                        const newFormData = { ...formData, parcelId: e.target.value };
                        setFormData(newFormData);
                        formDataRef.current = newFormData;
                        setTimeout(() => validateBuilding(), 0);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">请选择宗地</option>
                      {parcels.map((parcel) => (
                        <option key={parcel.id} value={parcel.id}>
                          {parcel.name} ({parcel.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-project-diagram mr-2 text-blue-500"></i>所属项目
                    </label>
                    <select
                      value={formData.projectId}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">请选择项目</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="fas fa-qrcode mr-2 text-blue-500"></i>赋码状态
                      </label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setFormData({ ...formData, isCoded: false })}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            !formData.isCoded
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          未赋码
                        </button>
                        <button
                          onClick={() => setFormData({ ...formData, isCoded: true })}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            formData.isCoded
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          已赋码
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <i className="fas fa-history mr-2 text-blue-500"></i>当前阶段
                      </label>
                      <select
                        value={formData.currentStage}
                        onChange={(e) => setFormData({ ...formData, currentStage: e.target.value as LifeCycleStage })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {stageOptions.map((stage) => (
                          <option key={stage} value={stage}>
                            {LIFE_CYCLE_STAGE_LABELS[stage]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            {step !== 'location' && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i>上一步
              </button>
            )}
            {step !== 'info' ? (
              <button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                下一步<i className="fas fa-arrow-right ml-2"></i>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceedToNext() || submitting}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2"></div>
                    提交中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>提交
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        <div className="absolute top-4 right-4 z-10 bg-white rounded-xl shadow-lg px-4 py-3">
          <div className="flex items-center space-x-3">
            <i className={`fas ${hint.icon} ${hint.color}`}></i>
            <span className="text-sm font-medium text-gray-700">{hint.text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBuilding;
