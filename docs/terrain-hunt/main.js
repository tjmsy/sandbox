import { isomizer } from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-isomizer@0.4/src/isomizer.js";
import { ScaleRatioControl } from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-scale-ratio@latest/src/maplibre-gl-scale-ratio.js";
import ContourIntervalControl from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-contour-interval@0.1/src/maplibre-gl-contour-interval.js";
import TerrainStatControl from "./control/terrain-stat.js";

const query = new URLSearchParams(window.location.search);

const projectConfigUrl =
  query.get("project") ??
  "./design-set/project-config.yml";

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {},
    layers: [],
    glyphs: "http://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  },
  center: [138.73, 35.36],
  zoom: 8,
  hash: true,
  localIdeographFontFamily: "sans-serif",
});

map.on("load", async () => {
  map.dragRotate.disable();
  map.keyboard.disable();
  map.touchZoomRotate.disableRotation();

  const demSource = new mlcontour.DemSource({
    url: "https://tiles.mapterhorn.com/{z}/{x}/{y}.webp",
    encoding: "terrarium",
    minzoom: 0,
    maxzoom: 15,
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
    maxzoom: 15,
    attribution:
      "<a href='https://mapterhorn.com/attribution' target='_blank'>© Mapterhorn</a>",
  });

  map.once("idle", async () => {
    await isomizer(map, projectConfigUrl);
  });

  // -------------------------
  // Controls: top-left
  // -------------------------

  map.addControl(new ScaleRatioControl(), "top-left");

  map.addControl(
    new TerrainStatControl({
      demTileUrl: "https://tiles.mapterhorn.com/{z}/{x}/{y}.webp",
      slopeTileUrl:
        "https://cyberjapandata.gsi.go.jp/xyz/slopemap/{z}/{x}/{y}.png",
      demEncoding: "terrarium",
    }),
    "top-left",
  );

  // -------------------------
  // Controls: top-right
  // -------------------------

  map.addControl(
    new MaplibreExportControl.MaplibreExportControl({
      PrintableArea: true,
      Crosshair: true,
      northIconOptions: { visibility: "none" },
    }),
    "top-right",
  );

  const defaultContourInterval = 5;
  const baseZoom = 13;
  map.addControl(
    new ContourIntervalControl(demSource, defaultContourInterval, baseZoom),
    "top-right",
  );

  // -------------------------
  // Controls: bottom-left
  // -------------------------

  map.addControl(new maplibregl.NavigationControl(), "bottom-right");

  // -------------------------
  // Controls: bottom-right
  // -------------------------
  map.addControl(
    new maplibregl.ScaleControl({ unit: "metric" }),
    "bottom-left",
  );
});
