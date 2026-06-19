import type { BuildingUsage, LifeCycleStage, RedlineType } from "../types";

export const USAGE_LABELS: Record<BuildingUsage, string> = {
  residential: "住宅",
  commercial: "商业",
  industrial: "工业",
  public: "公共",
  other: "其他",
};

export const LIFE_CYCLE_STAGE_LABELS: Record<LifeCycleStage, string> = {
  planning: "规划",
  construction: "建设",
  acceptance: "验收",
  registration: "登记",
  cancelled: "注销",
};

export const USAGE_COLORS: Record<BuildingUsage, string> = {
  residential: "#4CAF50",
  commercial: "#FF9800",
  industrial: "#F44336",
  public: "#2196F3",
  other: "#9C27B0",
};

export const YEAR_COLOR_RANGES = [
  { min: 1980, max: 1990, color: "#8D6E63" },
  { min: 1990, max: 2000, color: "#78909C" },
  { min: 2000, max: 2010, color: "#607D8B" },
  { min: 2010, max: 2020, color: "#546E7A" },
  { min: 2020, max: 2025, color: "#455A64" },
];

export const MIN_BUILD_YEAR = 1980;
export const MAX_BUILD_YEAR = 2025;

export const REDLINE_TYPE_LABELS: Record<RedlineType, string> = {
  ecological: "生态保护红线",
  historic: "历史街区保护线",
  planning: "规划控制线",
  flood: "防洪保护线",
  other: "其他管控线",
};

export const REDLINE_TYPE_COLORS: Record<RedlineType, string> = {
  ecological: "#16A34A",
  historic: "#B45309",
  planning: "#2563EB",
  flood: "#0891B2",
  other: "#6B7280",
};
