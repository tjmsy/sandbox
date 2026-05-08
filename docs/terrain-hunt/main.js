import { isomizer } from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-isomizer@0.4/src/isomizer.js";
import { ScaleRatioControl } from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-scale-ratio@latest/src/maplibre-gl-scale-ratio.js";
import ContourIntervalControl from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-contour-interval@0.1/src/maplibre-gl-contour-interval.js";
import TerrainStatControl from "./control/terrain-stat.js";
import StyleScratchpadControl from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-style-scratchpad@0.1/src/StyleScratchpadControl.js";

const query = new URLSearchParams(window.location.search);

const projectConfigUrl =
  query.get("project") ?? "./design-set/project-config.yml";

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

  map.addSource("gsi-std", {
    type: "raster",
    tiles: ["https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"],
    tileSize: 256,
    attribution:
      "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>",
  });

  map.addSource("seamlessphoto", {
    type: "raster",
    tiles: [
      "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
    ],
    tileSize: 256,
    minzoom: 13,
    maxzoom: 18,
    attribution:
      "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>国土地理院</a>",
  });

  map.addSource("forest", {
    type: "vector",
    tiles: [
      "https://rinya-tiles.geospatial.jp/fr_mesh20m_pbf_2025/{z}/{x}/{y}.pbf",
    ],
    minzoom: 13,
    maxzoom: 16,
    attribution:
      "<a href='https://www.geospatial.jp/ckan/dataset/mesh_tile' target='_blank'>全国森林資源メッシュマップタイル</a>",
  });

  map.once("idle", async () => {
    await isomizer(map, projectConfigUrl);

    map.addLayer({
      id: "gsi-std",
      type: "raster",
      source: "gsi-std",
      layout: {
        visibility: "none",
      },
      paint: {
        "raster-opacity": 1.0,
      },
    });

    map.addLayer({
      id: "seamlessphoto",
      type: "raster",
      source: "seamlessphoto",
      minzoom: 10,
      layout: {
        visibility: "none",
      },
      paint: {
        "raster-opacity": 1.0,
      },
    });

    map.addLayer({
      id: "スギ",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#FFFF00",
        "fill-opacity": 0.5,
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "スギ"],
    });
    map.addLayer({
      id: "ヒノキ類",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#4DC4FF",
        "fill-opacity": 0.5,
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "ヒノキ類"],
    });
    map.addLayer({
      id: "マツ類",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#f71212",
        "fill-opacity": 0.5,
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "マツ類"],
    });
    map.addLayer({
      id: "カラマツ",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#005AFF",
        "fill-opacity": 0.5,
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "カラマツ"],
    });
    map.addLayer({
      id: "トドマツ",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#FF9933",
        "fill-opacity": 0.5,
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "トドマツ"],
    });
    map.addLayer({
      id: "エゾマツ",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#89FAC2",
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "エゾマツ"],
    });
    map.addLayer({
      id: "ヒバ",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#FFFF00",
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "ヒバ"],
    });
    map.addLayer({
      id: "その他針葉樹",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#fd9191",
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "その他針葉樹"],
    });
    map.addLayer({
      id: "広葉樹",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#03AF7A",
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "広葉樹"],
    });
    map.addLayer({
      id: "タケ",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#FFCABF",
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "タケ"],
    });
    map.addLayer({
      id: "針広混交林",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#BFBFBF",
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "針広混交林"],
    });
    map.addLayer({
      id: "新植地",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      layout: {
        visibility: "none",
      },
      paint: {
        "fill-color": "#BFBFBF",
        "fill-opacity": 0.5,
      },
      filter: ["==", "森林簿樹種1", "新植地"],
    });
    map.addLayer({
      id: "伐採跡地",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#000000",
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "伐採跡地"],
    });
    map.addLayer({
      id: "その他",
      type: "fill",
      source: "forest",
      "source-layer": "全国森林資源メッシュ",
      paint: {
        "fill-color": "#BFBFBF",
        "fill-opacity": 0.5,
      },
      layout: {
        visibility: "none",
      },
      filter: ["==", "森林簿樹種1", "その他"],
    });
  });

  const layerManager = new LayerManager({
    title: "Panel",
    layers: [
      {
        id: "gsi-std",
        name: "標準地図(地理院タイル)",
        visible: false,
        opacity: 1.0,
      },
      {
        id: "seamlessphoto",
        name: "シームレス航空写真",
        visible: false,
        opacity: 1.0,
      },
      {
        id: "スギ",
        name: "スギ",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "ヒノキ類",
        name: "ヒノキ類",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "広葉樹",
        name: "広葉樹",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "伐採跡地",
        name: "伐採跡地",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "マツ類",
        name: "マツ類",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "カラマツ",
        name: "カラマツ",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "トドマツ",
        name: "トドマツ",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "エゾマツ",
        name: "エゾマツ",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "ヒバ",
        name: "ヒバ",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "その他針葉樹",
        name: "その他針葉樹",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "タケ",
        name: "タケ",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "針広混交林",
        name: "針広混交林",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "新植地",
        name: "新植地",
        visible: false,
        opacity: 0.5,
      },
      {
        id: "その他",
        name: "その他",
        visible: false,
        opacity: 0.5,
      },
    ],
    position: "top-left",
    collapsed: true,
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

  map.addControl(layerManager, "top-right");
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

  map.addControl(new StyleScratchpadControl(), "top-right");

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
