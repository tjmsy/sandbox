import { isomizer } from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-isomizer@0.3/src/isomizer.js";

const query = new URLSearchParams(window.location.search);

const projectConfigUrl = query.get("project") ?? "./project-config.yml";

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {},
    layers: [],
    glyphs: "http://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  },
  center: [0, 0],
  zoom: 15,
  maxPitch: 80,
  hash: true,
  localIdeographFontFamily: "sans-serif",
});

const geocoderApi = {
  forwardGeocode: async (config) => {
    const features = [];
    try {
      const request = `https://nominatim.openstreetmap.org/search?q=${config.query}&format=geojson&polygon_geojson=1&addressdetails=1`;
      const response = await fetch(request);
      const geojson = await response.json();
      for (const feature of geojson.features) {
        const center = [
          feature.bbox[0] + (feature.bbox[2] - feature.bbox[0]) / 2,
          feature.bbox[1] + (feature.bbox[3] - feature.bbox[1]) / 2,
        ];
        const point = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: center,
          },
          place_name: feature.properties.display_name,
          properties: feature.properties,
          text: feature.properties.display_name,
          place_type: ["place"],
          center,
        };
        features.push(point);
      }
    } catch (e) {
      console.error(`Failed to forwardGeocode with error: ${e}`);
    }

    return {
      features,
    };
  },
};

map.on("load", async () => {
  const demSource = new mlcontour.DemSource({
    url: "https://tiles.gsj.jp/tiles/elev/land/{z}/{y}/{x}.png",
    encoding: "numpng",
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
        thresholds: {
          5: [2560, 12800],
          6: [1280, 6400],
          7: [640, 3200],
          8: [320, 1600],
          9: [160, 800],
          10: [80, 400],
          11: [40, 200],
          12: [20, 100],
          13: [10, 50],
          14: [5, 25],
        },
        contourLayer: "contours",
        elevationKey: "ele",
        levelKey: "level",
        extent: 4096,
        buffer: 1,
      }),
    ],
    maxzoom: 15,
    attribution:
      "<a href='https://tiles.gsj.jp/tiles/elev/tiles.html#land' target='_blank'>産総研 シームレス標高タイル(陸域統合DEM)</a>",
  });

  map.addSource("terrain", {
    type: "raster-dem",
    tiles: [
      "https://gbank.gsj.jp/seamless/elev/terrainRGB/land/{z}/{y}/{x}.png",
    ],
    tileSize: 256,
    maxzoom: 15,
  });

  await isomizer(map, projectConfigUrl);

  map.addControl(
    new MaplibreGeocoder(geocoderApi, {
      maplibregl,
    }),
    "top-left"
  );
  map.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    }),
    "top-right"
  );

  map.addControl(new maplibregl.NavigationControl(), "bottom-right");
  map.addControl(
    new maplibregl.ScaleControl({ unit: "metric" }),
    "bottom-left"
  );
});
