import GeoJsonExportControl from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-geojson-export/src/maplibre-gl-geojson-export.js";
import terrainParameterControl from "https://cdn.jsdelivr.net/gh/tjmsy/orilibre-utils@latest/src/controls/terrainParameterControl.js";

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
      "contour-source": {
        type: "vector",
        tiles: [
          "dem-contour://{z}/{x}/{y}?buffer=1&contourLayer=contours&elevationKey=ele&extent=4096&levelKey=level&thresholds=14*5*25~13*10*50~12*20*100~11*40*200~10*80*400~9*160*800~8*320*1600~7*640*3200~6*1280*6400*2560*12800",
        ],
        attribution:
          "<a href='https://tiles.gsj.jp/tiles/elev/tiles.html#h_land' target='_blank'>産総研 シームレス標高タイル(陸域統合DEM)</a>",
      },
    },
    layers: [
      {
        id: "raster-tiles",
        type: "raster",
        source: "osm",
        minzoom: 0,
        maxzoom: 18,
      },
      {
        id: "contours",
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
      },
    ],
  },
  center: [139.68786, 35.68355],
  zoom: 13,
  hash: true,
});

const demSource = new mlcontour.DemSource({
  url: "https://gbank.gsj.jp/seamless/elev/terrainRGB/land/{z}/{y}/{x}.png",
  encoding: "mapbox",
  minzoom: 0,
  maxzoom: 19,
  worker: true,
  cacheSize: 100,
  timeoutMs: 30_000,
});

map.on("load", () => {
  map.addControl(new terrainParameterControl(demSource), "top-left");
  map.addControl(new GeoJsonExportControl(), "top-left");
});
