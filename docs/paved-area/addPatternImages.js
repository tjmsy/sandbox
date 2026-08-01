const PATTERNS = [
  "boulder-field-pattern",
  "cultivated-land-pattern",
  "marsh-pattern",
  "orchard-pattern",
  "sandy-ground-pattern",
];

function getExtension(path) {
  return path?.split("?")[0].split(".").pop()?.toLowerCase();
}

async function loadImageFromUrl(url) {
  const img = new Image();
  img.crossOrigin = "anonymous";

  img.src = url;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  return img;
}

async function svgTextToImage(svgText) {
  let cleaned = svgText.replace(/|<script[\s\S]*?<\/script>/g, "");

  if (!cleaned.includes("width=")) {
    cleaned = cleaned.replace("<svg", '<svg width="32" height="32"');
  }

  const blob = new Blob([cleaned], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    return await loadImageFromUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function getImage({ svg, url }) {
  if (typeof svg === "string" && svg.trim()) {
    return svgTextToImage(svg);
  }
  if (!url) return null;

  const ext = getExtension(url);

  if (ext === "svg") {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch SVG: ${url} (${res.status})`);
    }
    const text = await res.text();
    return svgTextToImage(text);
  }

  if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
    return loadImageFromUrl(url);
  }

  throw new Error(`Unsupported image format: ${url}`);
}

export function setupPatternLoader(map) {
  map.on("styleimagemissing", async (e) => {
    const id = e.id;

    if (!PATTERNS.includes(id)) return;

    if (map.hasImage(id)) return;

    try {
      const url = `./patterns/${id}.svg`;

      const img = await getImage({ url });

      if (img && !map.hasImage(id)) {
        map.addImage(id, img);
        console.log(`Successfully loaded pattern via event: ${id}`);
      }
    } catch (err) {
      console.error(`Error processing image with id ${id}:`, err);
    }
  });
}