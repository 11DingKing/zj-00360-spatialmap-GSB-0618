import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { initDatabase } from "./db/init";
import { getDb, isDatabaseEmpty } from "./db";
import { seedData, seedRedlines } from "./db/seed";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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

app.use("/api", routes);

app.use(errorHandler);

async function startServer() {
  try {
    initDatabase();

    if (isDatabaseEmpty()) {
      console.log("Database is empty, seeding initial data...");
      seedData();
    } else {
      const redlineCount = (
        getDb().prepare("SELECT COUNT(*) as count FROM redlines").get() as {
          count: number;
        }
      ).count;
      if (redlineCount === 0) {
        console.log("No redlines found, seeding redline data...");
        seedRedlines();
      }
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
