"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.closeDb = closeDb;
exports.isDatabaseEmpty = isDatabaseEmpty;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(__dirname, '../../../data/spatialmap.db');
let db = null;
function getDb() {
    if (!db) {
        db = new better_sqlite3_1.default(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
}
function closeDb() {
    if (db) {
        db.close();
        db = null;
    }
}
function isDatabaseEmpty() {
    const database = getDb();
    const row = database.prepare(`
    SELECT COUNT(*) as count FROM buildings
  `).get();
    return row.count === 0;
}
//# sourceMappingURL=index.js.map