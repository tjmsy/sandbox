import GeoJsonExportControl from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-geojson-export/src/maplibre-gl-geojson-export.js";
import ContourIntervalControl from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-contour-interval/src/maplibre-gl-contour-interval.js";

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.jp/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution:
          '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
      },
    },
    layers: [
      {
        id: "raster-tiles",
        type: "raster",
        source: "osm",
      },
    ],
  },
  center: [138.7307, 35.3595],
  zoom: 9,
  hash: true,
});

map.on("load", () => {
  const defaultContourInterval = 5;

  const demSource = new mlcontour.DemSource({
    url: "https://gbank.gsj.jp/seamless/elev/terrainRGB/land/{z}/{y}/{x}.png",
    encoding: "mapbox",
    minzoom: 0,
    maxzoom: 19,
    worker: true,
    cacheSize: 100,
    timeoutMs: 30_000,
  });
  demSource.setupMaplibre(maplibregl);

  map.addSource("contour-source", {
    type: "vector",
    tiles: [
      demSource.contourProtocolUrl({
        thresholds: {},
        contourLayer: "contours",
        elevationKey: "ele",
        levelKey: "level",
        extent: 4096,
        buffer: 1,
      }),
    ],
    maxzoom: 19,
    attribution:
      "<a href='https://tiles.gsj.jp/tiles/elev/tiles.html#h_land' target='_blank'>産総研 シームレス標高タイル(陸域統合DEM)</a>",
  });

  map.addLayer({
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
      "line-color": "#D25C00",
    },
  });

  map.addControl(new GeoJsonExportControl(), "top-left");
  map.addControl(
    new ContourIntervalControl(demSource, defaultContourInterval),
    "top-left"
  );
});
