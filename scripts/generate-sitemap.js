#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Function to read _meta.js files
function readMetaFile(dirPath) {
  const metaPath = path.join(dirPath, "_meta.js");
  if (fs.existsSync(metaPath)) {
    try {
      const content = fs.readFileSync(metaPath, "utf8");
      const match = content.match(/export\s+default\s+({[\s\S]*})/);
      if (match) {
        const metaString = match[1];
        return eval(`(${metaString})`);
      }
    } catch (error) {
      console.warn(`Error reading meta file at ${metaPath}:`, error);
    }
  }
  return null;
}

// Function to recursively get all documentation files
function getDocFiles(dirPath, baseDir, routes = []) {
  const files = fs.readdirSync(dirPath);
  const meta = readMetaFile(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.relative(baseDir, fullPath);

    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== "node_modules" && file !== ".git" && !file.startsWith(".")) {
        const title =
          meta && typeof meta[file] === "string" ? meta[file] : undefined;

        getDocFiles(fullPath, baseDir, routes);

        const indexPath = path.join(fullPath, "index.mdx");
        if (fs.existsSync(indexPath)) {
          routes.push({
            path: `/${relativePath}`,
            title,
          });
        }
      }
    } else {
      if (
        (file.endsWith(".mdx") || file.endsWith(".md")) &&
        file !== "_meta.js"
      ) {
        // Remove file extension and 'page' suffix
        let routePath = relativePath.replace(/\.(mdx|md)$/, "");
        routePath = routePath.replace(/\/page$/, "");

        if (!routePath.endsWith("index")) {
          routes.push({
            path: `/${routePath}`,
            title:
              meta && typeof meta[file.replace(/\.(mdx|md)$/, "")] === "string"
                ? meta[file.replace(/\.(mdx|md)$/, "")]
                : undefined,
          });
        }
      }
    }
  });

  return routes;
}

// Generate sitemap
function generateSitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://docs.incerto.in";
  const appDir = path.join(process.cwd(), "app");

  console.log("🔍 Scanning documentation files...");
  const routes = getDocFiles(appDir, appDir);

  console.log(`📄 Found ${routes.length} documentation pages:`);
  routes.forEach((route) => {
    console.log(`  - ${route.path}${route.title ? ` (${route.title})` : ""}`);
  });

  const sitemapEntries = routes.map((route) => {
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

    let changeFrequency = "weekly";
    if (route.path === "/get-started/quick-start") {
      changeFrequency = "daily";
    }

    return {
      url: `${baseUrl}${route.path}`,
      lastModified: new Date().toISOString(),
      changeFrequency,
      priority,
    };
  });

  const staticEntries = [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const allEntries = [...staticEntries, ...sitemapEntries];

  console.log("\n📊 Generated sitemap entries:");
  allEntries.forEach((entry) => {
    console.log(
      `  - ${entry.url} (priority: ${entry.priority}, frequency: ${entry.changeFrequency})`
    );
  });

  return allEntries;
}

// Run the generator
if (require.main === module) {
  try {
    const sitemap = generateSitemap();
    console.log(
      `\n✅ Successfully generated sitemap with ${sitemap.length} entries`
    );
    console.log(
      `🌐 Your sitemap will be available at: ${
        process.env.NEXT_PUBLIC_SITE_URL || "https://docs.incerto.in"
      }/sitemap.xml`
    );
  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
    process.exit(1);
  }
}

module.exports = { generateSitemap };
