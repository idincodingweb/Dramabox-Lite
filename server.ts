import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";

const REPO_BASE = "https://api.github.com/repos/idincodingweb/DracinApiByIdinCode/contents";
const RAW_BASE = "https://raw.githubusercontent.com/idincodingweb/DracinApiByIdinCode/main";

let cachedPlayableIds: Set<string> | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function getPlayableDramaIds(): Promise<Set<string>> {
  if (cachedPlayableIds && (Date.now() - lastCacheTime < CACHE_TTL)) {
    return cachedPlayableIds;
  }
  
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { "User-Agent": "Nodejs" };
  if (token) headers["Authorization"] = `token ${token}`;

  try {
    const res = await axios.get('https://api.github.com/repos/idincodingweb/DracinApiByIdinCode/contents/Raw%20Episode', { headers });
    const files = res.data;
    
    const batchSize = 50;
    const playableIds = new Set<string>();
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const promises = batch.map(async (f: any) => {
        try {
          const match = f.name.match(/raw_episodes_(\d+)\.json/);
          if (!match) return;
          const bookId = match[1];
          
          const epRes = await axios.get(f.download_url);
          const eps = typeof epRes.data === 'string' ? JSON.parse(epRes.data) : epRes.data;
          const firstEp = eps[0];
          if (!firstEp) return;
          
          let playable = false;
          for (const cdn of firstEp.cdnList || []) {
            for (const vp of cdn.videoPathList || []) {
              if (vp.videoPath && !vp.videoPath.includes('.encrypt.') && !vp.videoPath.includes('encrypt=1')) {
                playable = true;
                break;
              }
            }
            if (playable) break;
          }
          if (playable) {
            playableIds.add(bookId);
          }
        } catch (e) {
          // ignore error for individual file
        }
      });
      await Promise.all(promises);
    }
    
    cachedPlayableIds = playableIds;
    lastCacheTime = Date.now();
    return playableIds;
  } catch (err) {
    console.error("Failed to fetch playable IDs", err);
    return cachedPlayableIds || new Set<string>();
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/dramas", async (req, res) => {
    try {
      const token = process.env.GITHUB_TOKEN;
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3.raw",
      };
      if (token) headers["Authorization"] = `token ${token}`;

      const urls = [
        `${RAW_BASE}/List%20Data/ListDataByIdinCode.json`,
        `${RAW_BASE}/List%20Data/Listdata_dua_byidincode.json`
      ];

      const [dramasRes, playableIds] = await Promise.all([
        Promise.all(urls.map(url => axios.get(url, { headers }).then(r => r.data).catch(e => {
          console.error(`Failed to fetch ${url}: ${e.message}`);
          return [];
        }))),
        getPlayableDramaIds()
      ]);

      let allDramas: any[] = [];
      for (const data of dramasRes) {
        if (Array.isArray(data)) {
          allDramas.push(...data);
        } else if (typeof data === 'string') {
          try {
            allDramas.push(...JSON.parse(data));
          } catch(e) {}
        }
      }

      // Filter only playable dramas
      allDramas = allDramas.filter(d => playableIds.has(String(d.bookId)));

      res.json(allDramas);
    } catch (err) {
      console.error((err as any).message);
      res.status(500).json({ error: "Failed to fetch dramas" });
    }
  });

  app.get("/api/episodes/:id", async (req, res) => {
    try {
      const token = process.env.GITHUB_TOKEN;
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3.raw",
      };
      if (token) headers["Authorization"] = `token ${token}`;

      const id = req.params.id;
      const url = `${RAW_BASE}/Raw%20Episode/raw_episodes_${id}.json`;
      
      const response = await axios.get(url, { headers });
      let data = response.data;
      if (typeof data === 'string') data = JSON.parse(data);
      res.json(data);
    } catch (err) {
      console.error((err as any).message);
      res.status(500).json({ error: "Failed to fetch episodes" });
    }
  });

  // Proxy to bypass hotlink protection for images
  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) return res.status(400).send("No URL provided");
    try {
      const response = await axios({
        method: "get",
        url: imageUrl,
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://dramaboxdb.com/",
          "Origin": "https://dramaboxdb.com",
        },
        validateStatus: () => true
      });
      const contentType = response.headers["content-type"];
      if (contentType) res.set("Content-Type", contentType as string);
      res.set("Cache-Control", "public, max-age=86400");
      res.status(response.status);
      response.data.pipe(res);
    } catch (error) {
      console.error("Proxy image error:", (error as any).message);
      res.status(500).send("Failed to proxy image");
    }
  });

  // Proxy to bypass hotlink protection for videos
  app.get("/api/proxy-video", async (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl) return res.status(400).send("No URL provided");
    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://dramaboxdb.com/",
        "Origin": "https://dramaboxdb.com",
      };
      
      if (req.headers.range) {
        headers["Range"] = req.headers.range;
      }

      const response = await axios({
        method: "get",
        url: videoUrl,
        responseType: "stream",
        headers,
        validateStatus: (s) => s < 400 || s === 416,
      });

      const len = response.headers["content-length"];
      if (len) res.set("Content-Length", String(len));
      const type = response.headers["content-type"];
      if (type) res.set("Content-Type", String(type));
      const range = response.headers["content-range"];
      if (range) res.set("Content-Range", String(range));
      const acceptRanges = response.headers["accept-ranges"];
      if (acceptRanges) res.set("Accept-Ranges", String(acceptRanges));

      res.status(response.status);
      response.data.pipe(res);
    } catch (error) {
      console.error("Proxy video error:", (error as any).message);
      res.status(500).send("Failed to proxy video");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
