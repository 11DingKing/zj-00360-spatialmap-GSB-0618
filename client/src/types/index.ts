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
  | "farmland"
  | "water"
  | "infrastructure"
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

export interface ConflictBuilding {
  building: BuildingWithRelations;
  conflictRedlineIds: string[];
  conflictRedlineTypes: RedlineType[];
  conflictRedlineNames: string[];
}

export interface ConflictSummary {
  type: RedlineType;
  typeName: string;
  count: number;
}

export interface RedlineAnalysisResult {
  totalBuildings: number;
  conflictBuildings: ConflictBuilding[];
  conflictCount: number;
  parcelsInArea: Parcel[];
  redlinesInArea: Redline[];
  summaryByType: ConflictSummary[];
}

export interface RedlineTypeInfo {
  type: RedlineType;
  name: string;
  count: number;
}
