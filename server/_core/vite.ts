import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const dirname = import.meta.dirname || process.cwd();
      const clientTemplate = path.resolve(
        dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const dirname = import.meta.dirname || process.cwd();
  
  // Try multiple possible paths for the build directory
  const possiblePaths = [
    dirname && dirname !== "undefined" ? path.resolve(dirname, "../client/dist") : null,
    "/app/client/dist",
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(process.cwd(), "client/dist"),
  ].filter((p): p is string => p !== null && p !== "undefined");
  
  let distPath: string | null = null;
  for (const tryPath of possiblePaths) {
    if (fs.existsSync(tryPath)) {
      distPath = tryPath;
      console.log(`[serveStatic] Found build directory at: ${distPath}`);
      break;
    }
  }
  
  if (!distPath) {
    console.error(`[serveStatic] Build directory not found. Tried: ${possiblePaths.join(", ")}`);
    return;
  }

  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath!, "index.html");
    if (!fs.existsSync(indexPath)) {
      console.error(`[serveStatic] index.html not found at: ${indexPath}`);
      res.status(404).send("Not found");
      return;
    }
    res.sendFile(indexPath);
  });
}
