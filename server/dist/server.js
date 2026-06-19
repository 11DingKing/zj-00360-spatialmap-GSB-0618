"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const init_1 = require("./db/init");
const db_1 = require("./db");
const seed_1 = require("./db/seed");
const app = (0, express_1.default)();
const PORT = 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "服务运行正常",
        data: {
            status: "ok",
            timestamp: new Date().toISOString(),
        },
    });
});
app.use("/api", routes_1.default);
app.use(errorHandler_1.errorHandler);
async function startServer() {
    try {
        (0, init_1.initDatabase)();
        if ((0, db_1.isDatabaseEmpty)()) {
            console.log("Database is empty, seeding initial data...");
            (0, seed_1.seedData)();
        }
        else {
            const redlineCount = (0, db_1.getDb)().prepare("SELECT COUNT(*) as count FROM redlines").get().count;
            if (redlineCount === 0) {
                console.log("No redlines found, seeding redline data...");
                (0, seed_1.seedRedlines)();
            }
        }
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map