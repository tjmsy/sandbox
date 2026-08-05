import GeoJsonExportControl from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-geojson-export/src/maplibre-gl-geojson-export.js";
import { setupPatternLoader } from "./addPatternImages.js";

const map = new maplibregl.Map({
  container: "map",
  style: "./style.json",
  center: [139.764692, 35.681392],
  zoom: 16,
  hash: true,
});

map.on("load", () => {
  try {
    setupPatternLoader(map);
  } catch (e) {
    console.error("Pattern images loading failed:", e);
  }

  const demSource = new mlcontour.DemSource({
    url: "https://tiles.mapterhorn.com/{z}/{x}/{y}.webp",
    encoding: "terrarium",
    minzoom: 5,
    maxzoom: 15,
    worker: true,
    cacheSize: 300,
    timeoutMs: 10_000,
  });
  demSource.setupMaplibre(maplibregl);

  map.addSource("contour-source", {
    type: "vector",
    tiles: [
      demSource.contourProtocolUrl({
        thresholds: {
          5: [1280, 6400],
          7: [320, 1600],
          9: [80, 400],
          11: [20, 100],
          13: [5, 25],
          15: [5, 25],
        },
        contourLayer: "contours",
        elevationKey: "ele",
        levelKey: "level",
        extent: 4096,
        buffer: 1,
        overzoom: 1,
      }),
    ],
    maxzoom: 16,
    attribution:
      "<a href='https://mapterhorn.com/attribution' target='_blank'>© Mapterhorn</a>",
  });

  map.addLayer(
    {
      id: "contour-lines",
      type: "line",
      source: "contour-source",
      "source-layer": "contours",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-width": ["match", ["get", "level"], 1, 1, 0.56],
        "line-color": "#BE7A54",
      },
    },
    "301-1-water-boundary-gsivt-coastline",
  );

  map.addLayer(
    {
      id: "101-2-contour-halo-contour-source-contours",
      type: "line",
      source: "contour-source",
      "source-layer": "contours",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-width": ["match", ["get", "level"], 1, 1.3, 0.7],
        "line-opacity": 0.6,
        "line-color": "#79492F",
      },
    },
    "park-ofm-landcover",
  );

  map.addControl(new GeoJsonExportControl(), "top-left");
});
