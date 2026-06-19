import { getDb } from "./index";
import { v4 as uuidv4 } from "uuid";
import type { BuildingUsage, LifeCycleStage } from "../types";

const CENTER_LNG = 116.45;
const CENTER_LAT = 39.93;
const GRID_SIZE = 0.008;

interface SeedBuilding {
  id: string;
  name: string;
  address: string;
  usage: BuildingUsage;
  buildYear: number;
  floors: number;
  undergroundFloors: number;
  buildingArea: number;
  lng: number;
  lat: number;
  size: number;
  parcelId: string;
  projectId: string;
  isCoded: number;
  currentStage: LifeCycleStage;
}

function generatePolygon(lng: number, lat: number, size: number): string {
  const half = size / 2;
  const coordinates = [
    [lng - half, lat - half],
    [lng + half, lat - half],
    [lng + half, lat + half],
    [lng - half, lat + half],
    [lng - half, lat - half],
  ];
  return JSON.stringify({
    type: "Polygon",
    coordinates: [coordinates],
  });
}

function generatePoint(lng: number, lat: number): string {
  return JSON.stringify({
    type: "Point",
    coordinates: [lng, lat],
  });
}

const usages: BuildingUsage[] = [
  "residential",
  "commercial",
  "industrial",
  "public",
  "other",
];
const stages: LifeCycleStage[] = [
  "planning",
  "construction",
  "acceptance",
  "registration",
  "cancelled",
];

function getRandomUsage(): BuildingUsage {
  const weights = [0.5, 0.2, 0.15, 0.1, 0.05];
  const rand = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (rand < sum) return usages[i];
  }
  return "residential";
}

function getRandomYear(): number {
  return Math.floor(Math.random() * 40) + 1985;
}

function getRandomStage(): LifeCycleStage {
  const weights = [0.05, 0.1, 0.1, 0.7, 0.05];
  const rand = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (rand < sum) return stages[i];
  }
  return "registration";
}

function generateBuildings(count: number): SeedBuilding[] {
  const buildings: SeedBuilding[] = [];
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const offsetX = (Math.random() - 0.5) * 0.001;
    const offsetY = (Math.random() - 0.5) * 0.001;
    const lng =
      CENTER_LNG - GRID_SIZE / 2 + (col + 0.5) * (GRID_SIZE / cols) + offsetX;
    const lat =
      CENTER_LAT - GRID_SIZE / 2 + (row + 0.5) * (GRID_SIZE / rows) + offsetY;

    const usage = getRandomUsage();
    const buildYear = getRandomYear();
    const floors =
      usage === "industrial"
        ? Math.floor(Math.random() * 5) + 1
        : usage === "commercial"
          ? Math.floor(Math.random() * 20) + 3
          : Math.floor(Math.random() * 25) + 2;

    const buildingNum = i + 1;
    const isCoded = Math.random() > 0.1 ? 1 : 0;

    buildings.push({
      id: `110105001001GB00001F${buildingNum.toString().padStart(4, "0")}`,
      name: `阳光花园${buildingNum}号楼`,
      address: `北京市朝阳区阳光路${buildingNum}号`,
      usage,
      buildYear,
      floors,
      undergroundFloors: Math.floor(Math.random() * 3),
      buildingArea: floors * 800 + Math.floor(Math.random() * 2000),
      lng,
      lat,
      size: 0.0003 + Math.random() * 0.0003,
      parcelId: "P001",
      projectId: "PRJ001",
      isCoded,
      currentStage: getRandomStage(),
    });
  }

  return buildings;
}

export function seedData(): void {
  const db = getDb();

  const parcelBoundary = JSON.stringify({
    type: "Polygon",
    coordinates: [
      [
        [
          CENTER_LNG - GRID_SIZE / 2 - 0.001,
          CENTER_LAT - GRID_SIZE / 2 - 0.001,
        ],
        [
          CENTER_LNG + GRID_SIZE / 2 + 0.001,
          CENTER_LAT - GRID_SIZE / 2 - 0.001,
        ],
        [
          CENTER_LNG + GRID_SIZE / 2 + 0.001,
          CENTER_LAT + GRID_SIZE / 2 + 0.001,
        ],
        [
          CENTER_LNG - GRID_SIZE / 2 - 0.001,
          CENTER_LAT + GRID_SIZE / 2 + 0.001,
        ],
        [
          CENTER_LNG - GRID_SIZE / 2 - 0.001,
          CENTER_LAT - GRID_SIZE / 2 - 0.001,
        ],
      ],
    ],
  });

  const insertParcel = db.prepare(`
    INSERT OR REPLACE INTO parcels (id, code, name, boundary, area)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertParcel.run(
    "P001",
    "110105001001GB00001",
    "朝阳宗地A",
    parcelBoundary,
    640000,
  );

  const insertProject = db.prepare(`
    INSERT OR REPLACE INTO projects (id, name, developer, start_date, end_date)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertProject.run(
    "PRJ001",
    "阳光花园小区",
    "北京阳光地产",
    "2018-03-15",
    "2024-12-30",
  );

  const buildings = generateBuildings(50);

  const insertBuilding = db.prepare(`
    INSERT OR REPLACE INTO buildings 
    (id, name, address, usage, build_year, floors, underground_floors, building_area, 
     location, outline, parcel_id, project_id, is_coded, current_stage)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLifecycle = db.prepare(`
    INSERT OR REPLACE INTO life_cycle_records (id, building_id, stage, date, operator, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const b of buildings) {
      const location = generatePoint(b.lng, b.lat);
      const outline = generatePolygon(b.lng, b.lat, b.size);

      insertBuilding.run(
        b.id,
        b.name,
        b.address,
        b.usage,
        b.buildYear,
        b.floors,
        b.undergroundFloors,
        b.buildingArea,
        location,
        outline,
        b.parcelId,
        b.projectId,
        b.isCoded,
        b.currentStage,
      );

      const stageOrder: LifeCycleStage[] = [
        "planning",
        "construction",
        "acceptance",
        "registration",
        "cancelled",
      ];
      const currentIdx = stageOrder.indexOf(b.currentStage);

      for (let i = 0; i <= currentIdx; i++) {
        const stage = stageOrder[i];
        if (stage === "cancelled" && i !== currentIdx) continue;

        const year = b.buildYear - (currentIdx - i);
        insertLifecycle.run(
          uuidv4(),
          b.id,
          stage,
          `${year}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 28) + 1}`,
          "系统管理员",
          `${stage === "planning" ? "规划许可" : stage === "construction" ? "开工建设" : stage === "acceptance" ? "竣工验收" : stage === "registration" ? "产权登记" : "注销登记"}`,
        );
      }
    }
  });

  tx();
  console.log(`Seeded ${buildings.length} buildings successfully.`);

  seedRedlines();
}

export function seedRedlines(): void {
  const db = getDb();

  const halfGrid = GRID_SIZE / 2;

  const ecologicalBoundary = JSON.stringify({
    type: "Polygon",
    coordinates: [
      [
        [CENTER_LNG - halfGrid - 0.0005, CENTER_LAT - halfGrid - 0.0005],
        [CENTER_LNG - halfGrid + 0.003, CENTER_LAT - halfGrid - 0.0005],
        [CENTER_LNG - halfGrid + 0.003, CENTER_LAT - halfGrid + 0.003],
        [CENTER_LNG - halfGrid - 0.0005, CENTER_LAT - halfGrid + 0.003],
        [CENTER_LNG - halfGrid - 0.0005, CENTER_LAT - halfGrid - 0.0005],
      ],
    ],
  });

  const historicBoundary = JSON.stringify({
    type: "Polygon",
    coordinates: [
      [
        [CENTER_LNG + 0.001, CENTER_LAT + 0.001],
        [CENTER_LNG + halfGrid + 0.001, CENTER_LAT + 0.001],
        [CENTER_LNG + halfGrid + 0.001, CENTER_LAT + halfGrid + 0.001],
        [CENTER_LNG + 0.001, CENTER_LAT + halfGrid + 0.001],
        [CENTER_LNG + 0.001, CENTER_LAT + 0.001],
      ],
    ],
  });

  const planningBoundary = JSON.stringify({
    type: "Polygon",
    coordinates: [
      [
        [CENTER_LNG - 0.002, CENTER_LAT - 0.002],
        [CENTER_LNG + 0.002, CENTER_LAT - 0.002],
        [CENTER_LNG + 0.002, CENTER_LAT + 0.002],
        [CENTER_LNG - 0.002, CENTER_LAT + 0.002],
        [CENTER_LNG - 0.002, CENTER_LAT - 0.002],
      ],
    ],
  });

  const insertRedline = db.prepare(`
    INSERT OR REPLACE INTO redlines (id, code, name, type, boundary, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertRedline.run(
    "RL001",
    "ECO-001",
    "生态保护红线-东郊湿地",
    "ecological",
    ecologicalBoundary,
    "严禁建设的生态保护范围",
  );
  insertRedline.run(
    "RL002",
    "HIS-001",
    "历史街区保护线-老城南片区",
    "historic",
    historicBoundary,
    "历史风貌建筑保护范围，限高限建",
  );
  insertRedline.run(
    "RL003",
    "PLN-001",
    "规划控制线-中心轴带",
    "planning",
    planningBoundary,
    "规划预留通道，禁止违规建设",
  );

  console.log("Seeded 3 redlines successfully.");
}

if (require.main === module) {
  seedData();
}
