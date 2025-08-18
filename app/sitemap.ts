import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

interface MetaData {
  [key: string]: string | MetaData;
}

// Function to read _meta.js files
function readMetaFile(dirPath: string): MetaData | null {
  const metaPath = path.join(dirPath, "_meta.js");
  if (fs.existsSync(metaPath)) {
    try {
      // Read the file content
      const content = fs.readFileSync(metaPath, "utf8");
      // Extract the export default object
      const match = content.match(/export\s+default\s+({[\s\S]*})/);
      if (match) {
        // This is a simplified parser - in production you might want to use a proper JS parser
        const metaString = match[1];
        // Convert the JS object string to a proper object
        // This is a basic implementation - you might need to enhance it
        return eval(`(${metaString})`);
      }
    } catch (error) {
      console.warn(`Error reading meta file at ${metaPath}:`, error);
    }
  }
  return null;
}

// Function to recursively get all documentation files
function getDocFiles(
  dirPath: string,
  baseDir: string,
  routes: Array<{ path: string; title?: string }> = []
): Array<{ path: string; title?: string }> {
  const files = fs.readdirSync(dirPath);
  const meta = readMetaFile(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.relative(baseDir, fullPath);

    if (fs.statSync(fullPath).isDirectory()) {
      // Skip node_modules, .git, and hidden directories
      if (file !== "node_modules" && file !== ".git" && !file.startsWith(".")) {
        // Get the title from meta file if available
        const title =
          meta && typeof meta[file] === "string"
            ? (meta[file] as string)
            : undefined;

        // Recursively process subdirectories
        getDocFiles(fullPath, baseDir, routes);

        // Add the directory itself as a route if it has an index file
        const indexPath = path.join(fullPath, "index.mdx");
        if (fs.existsSync(indexPath)) {
          routes.push({
            path: `/${relativePath}`,
            title,
          });
        }
      }
    } else {
      // Only include .mdx and .md files, skip _meta.js and other config files
      if (
        (file.endsWith(".mdx") || file.endsWith(".md")) &&
        file !== "_meta.js"
      ) {
        // Remove file extension and 'page' suffix
        let routePath = relativePath.replace(/\.(mdx|md)$/, "");
        routePath = routePath.replace(/\/page$/, "");

        // Skip index files as they're handled above
        if (!routePath.endsWith("index")) {
          routes.push({
            path: `/${routePath}`,
            title:
              meta && typeof meta[file.replace(/\.(mdx|md)$/, "")] === "string"
                ? (meta[file.replace(/\.(mdx|md)$/, "")] as string)
                : undefined,
          });
        }
      }
    }
  });

  return routes;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.incerto.in";
  const appDir = path.join(process.cwd(), "app");

  // Get all documentation routes
  const routes = getDocFiles(appDir, appDir);

  // Convert routes to sitemap entries
  const sitemapEntries: MetadataRoute.Sitemap = routes.map((route) => {
    // Determine priority based on path
    let priority = 0.6;
    if (route.path === "/get-started/quick-start") {
      priority = 1.0;
    } else if (route.path.startsWith("/get-started")) {
      priority = 0.9;
    } else if (route.path.startsWith("/AI-Basics")) {
      priority = 0.8;
    } else if (route.path.startsWith("/database")) {
      priority = 0.7;
    }

    // Determine change frequency
    let changeFrequency:
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never" = "weekly";
    if (route.path === "/get-started/quick-start") {
      changeFrequency = "daily";
    }

    return {
      url: `${baseUrl}${route.path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
  });

  // Add static entries
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  return [...staticEntries, ...sitemapEntries];
}
