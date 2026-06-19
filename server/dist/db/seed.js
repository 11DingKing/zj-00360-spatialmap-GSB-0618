"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedData = seedData;
const index_1 = require("./index");
const uuid_1 = require("uuid");
const turf = __importStar(require("@turf/turf"));
const CENTER_LNG = 116.45;
const CENTER_LAT = 39.93;
const GRID_SIZE = 0.008;
function generatePolygon(lng, lat, size) {
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
function generatePoint(lng, lat) {
    return JSON.stringify({
        type: "Point",
        coordinates: [lng, lat],
    });
}
const usages = [
    "residential",
    "commercial",
    "industrial",
    "public",
    "other",
];
const stages = [
    "planning",
    "construction",
    "acceptance",
    "registration",
    "cancelled",
];
function getRandomUsage() {
    const weights = [0.5, 0.2, 0.15, 0.1, 0.05];
    const rand = Math.random();
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
        sum += weights[i];
        if (rand < sum)
            return usages[i];
    }
    return "residential";
}
function getRandomYear() {
    return Math.floor(Math.random() * 40) + 1985;
}
function getRandomStage() {
    const weights = [0.05, 0.1, 0.1, 0.7, 0.05];
    const rand = Math.random();
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
        sum += weights[i];
        if (rand < sum)
            return stages[i];
    }
    return "registration";
}
function generateBuildings(count) {
    const buildings = [];
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const offsetX = (Math.random() - 0.5) * 0.001;
        const offsetY = (Math.random() - 0.5) * 0.001;
        const lng = CENTER_LNG - GRID_SIZE / 2 + (col + 0.5) * (GRID_SIZE / cols) + offsetX;
        const lat = CENTER_LAT - GRID_SIZE / 2 + (row + 0.5) * (GRID_SIZE / rows) + offsetY;
        const usage = getRandomUsage();
        const buildYear = getRandomYear();
        const floors = usage === "industrial"
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
function seedData() {
    const db = (0, index_1.getDb)();
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
    insertParcel.run("P001", "110105001001GB00001", "朝阳宗地A", parcelBoundary, 640000);
    const insertProject = db.prepare(`
    INSERT OR REPLACE INTO projects (id, name, developer, start_date, end_date)
    VALUES (?, ?, ?, ?, ?)
  `);
    insertProject.run("PRJ001", "阳光花园小区", "北京阳光地产", "2018-03-15", "2024-12-30");
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
            insertBuilding.run(b.id, b.name, b.address, b.usage, b.buildYear, b.floors, b.undergroundFloors, b.buildingArea, location, outline, b.parcelId, b.projectId, b.isCoded, b.currentStage);
            const stageOrder = [
                "planning",
                "construction",
                "acceptance",
                "registration",
                "cancelled",
            ];
            const currentIdx = stageOrder.indexOf(b.currentStage);
            for (let i = 0; i <= currentIdx; i++) {
                const stage = stageOrder[i];
                if (stage === "cancelled" && i !== currentIdx)
                    continue;
                const year = b.buildYear - (currentIdx - i);
                insertLifecycle.run((0, uuid_1.v4)(), b.id, stage, `${year}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 28) + 1}`, "系统管理员", `${stage === "planning" ? "规划许可" : stage === "construction" ? "开工建设" : stage === "acceptance" ? "竣工验收" : stage === "registration" ? "产权登记" : "注销登记"}`);
            }
        }
    });
    tx();
    console.log(`Seeded ${buildings.length} buildings successfully.`);
    seedRedlines(db);
}
function seedRedlines(db) {
    const redlines = [
        {
            id: "RL001",
            name: "明城墙遗址公园保护范围",
            type: "heritage",
            description: "全国重点文物保护单位建设控制地带",
            boundary: {
                type: "Polygon",
                coordinates: [
                    [
                        [CENTER_LNG - GRID_SIZE / 3, CENTER_LAT - GRID_SIZE / 4],
                        [CENTER_LNG - GRID_SIZE / 6, CENTER_LAT - GRID_SIZE / 4],
                        [CENTER_LNG - GRID_SIZE / 6, CENTER_LAT + GRID_SIZE / 6],
                        [CENTER_LNG - GRID_SIZE / 3, CENTER_LAT + GRID_SIZE / 6],
                        [CENTER_LNG - GRID_SIZE / 3, CENTER_LAT - GRID_SIZE / 4],
                    ],
                ],
            },
        },
        {
            id: "RL002",
            name: "城市生态绿廊",
            type: "ecological",
            description: "城市永久性生态保护红线",
            boundary: {
                type: "Polygon",
                coordinates: [
                    [
                        [CENTER_LNG + GRID_SIZE / 6, CENTER_LAT - GRID_SIZE / 3],
                        [CENTER_LNG + GRID_SIZE / 3, CENTER_LAT - GRID_SIZE / 3],
                        [CENTER_LNG + GRID_SIZE / 3, CENTER_LAT + GRID_SIZE / 8],
                        [CENTER_LNG + GRID_SIZE / 6, CENTER_LAT + GRID_SIZE / 8],
                        [CENTER_LNG + GRID_SIZE / 6, CENTER_LAT - GRID_SIZE / 3],
                    ],
                ],
            },
        },
    ];
    const insertRedline = db.prepare(`
    INSERT OR REPLACE INTO redlines (id, name, type, description, boundary, area)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    const insertRedlineRtree = db.prepare(`
    INSERT OR REPLACE INTO redline_rtree (id, min_x, max_x, min_y, max_y)
    VALUES (?, ?, ?, ?, ?)
  `);
    for (const rl of redlines) {
        const boundaryStr = JSON.stringify(rl.boundary);
        const area = turf.area(rl.boundary);
        const bbox = turf.bbox(rl.boundary);
        insertRedline.run(rl.id, rl.name, rl.type, rl.description, boundaryStr, area);
        insertRedlineRtree.run(rl.id, bbox[0], bbox[2], bbox[1], bbox[3]);
    }
    console.log(`Seeded ${redlines.length} redlines successfully.`);
}
if (require.main === module) {
    seedData();
}
//# sourceMappingURL=seed.js.map