import axios from "axios";
import type {
  BuildingWithRelations,
  Building,
  Parcel,
  Project,
  FilterParams,
  StatsResult,
  ValidationResult,
  OverviewStats,
  QualityStats,
  ApiResponse,
  Redline,
  RedlineType,
  RedlineAnalysisResult,
  RedlineTypeInfo,
  Polygon,
} from "../types";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  },
);

export const buildingApi = {
  getBuildings: (params?: FilterParams) =>
    api.get<ApiResponse<BuildingWithRelations[]>>("/buildings", { params }),

  getBuilding: (id: string) =>
    api.get<ApiResponse<BuildingWithRelations>>(`/buildings/${id}`),

  createBuilding: (data: Omit<Building, "id" | "createdAt" | "updatedAt">) =>
    api.post<ApiResponse<Building>>("/buildings", data),

  updateBuilding: (id: string, data: Partial<Building>) =>
    api.put<ApiResponse<Building>>(`/buildings/${id}`, data),

  deleteBuilding: (id: string) =>
    api.delete<ApiResponse<null>>(`/buildings/${id}`),

  getBuildingsWithin: (
    minLng: number,
    maxLng: number,
    minLat: number,
    maxLat: number,
  ) =>
    api.get<ApiResponse<BuildingWithRelations[]>>("/buildings/within", {
      params: { minLng, maxLng, minLat, maxLat },
    }),

  getStats: (params?: FilterParams) =>
    api.get<ApiResponse<StatsResult>>("/buildings/stats", { params }),

  validateBuilding: (data: {
    location: any;
    outline: any;
    parcelId: string;
    excludeId?: string;
  }) => api.post<ApiResponse<ValidationResult>>("/buildings/validate", data),
};

export const parcelApi = {
  getParcels: () => api.get<ApiResponse<Parcel[]>>("/parcels"),
  getParcel: (id: string) => api.get<ApiResponse<Parcel>>(`/parcels/${id}`),
};

export const projectApi = {
  getProjects: () => api.get<ApiResponse<Project[]>>("/projects"),
  getProject: (id: string) => api.get<ApiResponse<Project>>(`/projects/${id}`),
};

export const statsApi = {
  getOverviewStats: () =>
    api.get<ApiResponse<OverviewStats>>("/stats/overview"),
  getUnmappedBuildings: () =>
    api.get<ApiResponse<BuildingWithRelations[]>>("/stats/unmapped"),
  getQualityStats: () => api.get<ApiResponse<QualityStats>>("/stats/quality"),
};

export const redlineApi = {
  getRedlines: (type?: RedlineType) =>
    api.get<ApiResponse<Redline[]>>("/redlines", { params: { type } }),

  getRedline: (id: string) => api.get<ApiResponse<Redline>>(`/redlines/${id}`),

  createRedline: (data: {
    name: string;
    type: RedlineType;
    description?: string;
    boundary: Polygon;
  }) => api.post<ApiResponse<Redline>>("/redlines", data),

  updateRedline: (
    id: string,
    data: Partial<{
      name: string;
      type: RedlineType;
      description: string;
      boundary: Polygon;
    }>,
  ) => api.put<ApiResponse<Redline>>(`/redlines/${id}`, data),

  deleteRedline: (id: string) =>
    api.delete<ApiResponse<null>>(`/redlines/${id}`),

  getTypes: () => api.get<ApiResponse<RedlineTypeInfo[]>>("/redlines/types"),

  analyzeArea: (polygon: Polygon) =>
    api.post<ApiResponse<RedlineAnalysisResult>>("/redlines/analyze", {
      polygon,
    }),
};

export default api;
