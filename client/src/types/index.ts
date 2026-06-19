export type BuildingUsage =
  | "residential"
  | "commercial"
  | "industrial"
  | "public"
  | "other";

export type LifeCycleStage =
  | "planning"
  | "construction"
  | "acceptance"
  | "registration"
  | "cancelled";

export interface Point {
  type: "Point";
  coordinates: [number, number];
}

export interface Polygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

export interface Building {
  id: string;
  name: string;
  address: string;
  usage: BuildingUsage;
  buildYear: number;
  floors: number;
  undergroundFloors: number;
  buildingArea: number;
  location: Point | null;
  outline: Polygon | null;
  parcelId: string | null;
  projectId: string | null;
  isCoded: boolean;
  currentStage: LifeCycleStage;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingWithRelations extends Building {
  parcelName?: string;
  parcelCode?: string;
  projectName?: string;
}

export interface Parcel {
  id: string;
  code: string;
  name: string;
  boundary: Polygon;
  area: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  developer: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LifeCycleRecord {
  id: string;
  buildingId: string;
  stage: LifeCycleStage;
  date: string;
  operator: string | null;
  remark: string | null;
  createdAt: string;
}

export interface FilterParams {
  usage?: BuildingUsage[];
  yearStart?: number;
  yearEnd?: number;
  isCoded?: boolean;
  hasLocation?: boolean;
  minLng?: number;
  maxLng?: number;
  minLat?: number;
  maxLat?: number;
}

export interface StatsResult {
  totalCount: number;
  byUsage: { usage: BuildingUsage; count: number; percentage: number }[];
  byYear: { year: number; count: number }[];
}

export interface ValidationError {
  type: "overlap" | "outside_parcel" | "invalid_geometry";
  message: string;
  overlappingBuildings?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface OverviewStats {
  totalBuildings: number;
  mappedBuildings: number;
  unmappedBuildings: number;
  coordinateMissingRate: number;
  codedBuildings: number;
  uncodedBuildings: number;
  byRegion: { name: string; count: number }[];
  byUsage: { usage: BuildingUsage; count: number }[];
}

export interface QualityStats {
  coordinateMissingRate: number;
  attributeCompleteRate: number;
  outlineCompleteRate: number;
  byRegion: { name: string; coordinateMissingRate: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type RedlineType =
  | "ecological"
  | "heritage"
  | "cultural"
  | "infrastructure"
  | "agricultural"
  | "other";

export interface Redline {
  id: string;
  name: string;
  type: RedlineType;
  description: string | null;
  boundary: Polygon;
  area: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictInfo {
  redlineId: string;
  redlineName: string;
  redlineType: RedlineType;
}

export interface BuildingWithConflicts extends BuildingWithRelations {
  hasConflict: boolean;
  conflicts: ConflictInfo[];
}

export interface AnalysisResult {
  buildings: BuildingWithConflicts[];
  parcels: Parcel[];
  conflictSummary: {
    type: RedlineType;
    typeName: string;
    count: number;
  }[];
  totalBuildings: number;
  totalConflicts: number;
  totalParcels: number;
}

export const REDLINE_TYPE_NAMES: Record<RedlineType, string> = {
  ecological: "生态红线",
  heritage: "历史街区保护线",
  cultural: "文物保护线",
  infrastructure: "基础设施管控线",
  agricultural: "永久基本农田",
  other: "其他管控线",
};

export const REDLINE_TYPE_COLORS: Record<RedlineType, string> = {
  ecological: "#EF4444",
  heritage: "#F59E0B",
  cultural: "#8B5CF6",
  infrastructure: "#3B82F6",
  agricultural: "#10B981",
  other: "#6B7280",
};
