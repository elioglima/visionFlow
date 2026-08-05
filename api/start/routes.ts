import router from "@adonisjs/core/services/router";
import { middleware } from "#start/kernel";

const VideosController = () => import("#controllers/videosController");

router
  .group(() => {
    router.get("/health", async () => ({
      status: "ok",
      service: "visionflow-api",
    }));
    router.post("/videos", [VideosController, "store"]);
    router.get("/videos", [VideosController, "index"]);
    router.get("/videos/:id", [VideosController, "show"]);
    router.patch("/videos/:id/progress", [VideosController, "updateProgress"]);
    router.get("/videos/:id/download", [VideosController, "download"]);
    router.get("/videos/:id/report", [VideosController, "report"]);
  })
  .prefix("/api");
