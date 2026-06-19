"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
const index_1 = require("./index");
function initDatabase() {
    const db = (0, index_1.getDb)();
    db.exec(`
    CREATE TABLE IF NOT EXISTS parcels (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      boundary TEXT NOT NULL,
      area REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      developer TEXT,
      start_date TEXT,
      end_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      usage TEXT NOT NULL CHECK (usage IN ('residential', 'commercial', 'industrial', 'public', 'other')),
      build_year INTEGER NOT NULL,
      floors INTEGER DEFAULT 0,
      underground_floors INTEGER DEFAULT 0,
      building_area REAL DEFAULT 0,
      location TEXT,
      outline TEXT,
      parcel_id TEXT,
      project_id TEXT,
      is_coded INTEGER DEFAULT 1,
      current_stage TEXT NOT NULL DEFAULT 'registration',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS life_cycle_records (
      id TEXT PRIMARY KEY,
      building_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      date TEXT NOT NULL,
      operator TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS building_rtree USING rtree(
      id,
      min_x, max_x,
      min_y, max_y
    );

    CREATE TABLE IF NOT EXISTS redlines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('ecological', 'heritage', 'cultural', 'infrastructure', 'agricultural', 'other')),
      description TEXT,
      boundary TEXT NOT NULL,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_buildings_usage ON buildings(usage);
    CREATE INDEX IF NOT EXISTS idx_buildings_year ON buildings(build_year);
    CREATE INDEX IF NOT EXISTS idx_buildings_coded ON buildings(is_coded);
    CREATE INDEX IF NOT EXISTS idx_buildings_parcel ON buildings(parcel_id);
    CREATE INDEX IF NOT EXISTS idx_lifecycle_building ON life_cycle_records(building_id);
    CREATE INDEX IF NOT EXISTS idx_redlines_type ON redlines(type);
  `);
    console.log("Database initialized successfully.");
}
if (require.main === module) {
    initDatabase();
}
//# sourceMappingURL=init.js.map