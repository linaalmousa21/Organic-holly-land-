import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import { makeProductImageKey, PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_MIME_TYPES, validateProductImage } from "../product-image-upload";
import { makeProductMediaKey, PRODUCT_VIDEO_MAX_BYTES, PRODUCT_VIDEO_MIME_TYPES, validateProductVideo } from "../product-media-upload";

type AuthenticatedUser = Awaited<ReturnType<typeof createContext>>["user"];

const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PRODUCT_IMAGE_MAX_BYTES, files: 1, fields: 4 },
  fileFilter: (_req, file, callback) => callback(null, PRODUCT_IMAGE_MIME_TYPES.has(file.mimetype)),
});
const productVideoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PRODUCT_VIDEO_MAX_BYTES, files: 1, fields: 4 },
  fileFilter: (_req, file, callback) => callback(null, PRODUCT_VIDEO_MIME_TYPES.has(file.mimetype)),
});

async function getRouteUser(req: Request, res: Response): Promise<AuthenticatedUser> {
  const context = await createContext({ req, res, info: undefined as never });
  return context.user;
}

function registerProductImageRoute(app: express.Express) {
  app.post("/api/admin/product-image", productImageUpload.single("image"), async (req, res) => {
    try {
      const user = await getRouteUser(req, res);
      if (!user) return res.status(401).json({ error: "Authentication required" });
      if (user.role !== "admin") return res.status(403).json({ error: "Admin role required" });
      if (!req.file) return res.status(400).json({ error: "Upload one image in the image field" });

      const validation = validateProductImage(req.file);
      if (!validation.ok) return res.status(415).json({ error: validation.message });

      const key = makeProductImageKey(user.id, req.file.originalname, req.file.mimetype);
      const stored = await storagePut(key, req.file.buffer, req.file.mimetype);
      return res.status(201).json({ url: stored.url, key: stored.key, contentType: req.file.mimetype, size: req.file.size });
    } catch (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: `Image must not exceed ${PRODUCT_IMAGE_MAX_BYTES} bytes` });
      }
      console.error("[Product image upload] failed", error);
      return res.status(500).json({ error: "Image upload failed" });
    }
  });
  app.post("/api/admin/product-video", productVideoUpload.single("video"), async (req, res) => {
    try {
      const user = await getRouteUser(req, res);
      if (!user) return res.status(401).json({ error: "Authentication required" });
      if (user.role !== "admin") return res.status(403).json({ error: "Admin role required" });
      if (!req.file) return res.status(400).json({ error: "Upload one video in the video field" });
      const validation = validateProductVideo(req.file);
      if (!validation.ok) return res.status(415).json({ error: validation.message });
      const key = makeProductMediaKey(user.id, req.file.originalname, req.file.mimetype);
      const stored = await storagePut(key, req.file.buffer, req.file.mimetype);
      return res.status(201).json({ url: stored.url, key: stored.key, contentType: req.file.mimetype, size: req.file.size });
    } catch (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "Video must not exceed 20 MB" });
      console.error("[Product video upload] failed", error);
      return res.status(500).json({ error: "Video upload failed" });
    }
  });
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true, service: "organic-holy-land-store" });
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerProductImageRoute(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  if (process.env.NODE_ENV === "development") await setupVite(app, server);
  else serveStatic(app);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

startServer().catch(console.error);
