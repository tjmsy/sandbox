const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {
      ofm: {
        type: "vector",
        url: "https://tiles.openfreemap.org/planet",
      },
      "contour-source": {
        type: "vector",
        tiles: [
          "dem-contour://{z}/{x}/{y}?buffer=1&contourLayer=contours&elevationKey=ele&extent=4096&levelKey=level&thresholds=9*200*1000~0*200*1000",
        ],
        attribution:
          "<a href='https://tiles.gsj.jp/tiles/elev/tiles.html#h_gebco' target='_blank'>GEBCO Grid (via Geological Survey of Japan, AIST)</a>",
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "black",
        },
      },
      {
        id: "water",
        type: "fill",
        source: "ofm",
        "source-layer": "water",
        paint: {
          "fill-color": "white",
        },
      },
    ],
  },
  center: [0, 0],
  zoom: 0,
  hash: true,
});

map.on("load", () => {
  const demSource = new mlcontour.DemSource({
    url: "https://gbank.gsj.jp/seamless/elev/terrainRGB/gebco/{z}/{y}/{x}.png",
    encoding: "mapbox",
    minzoom: 0,
    maxzoom: 9,
    worker: true,
    cacheSize: 100,
    timeoutMs: 30_000,
  });
  demSource.setupMaplibre(maplibregl);

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
      "line-width": ["match", ["get", "level"], 0, 1, 0.56],
      "line-color": "black",
    },
  });

  map.addSource("usgs", {
    type: "geojson",
    data: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
    attribution:
      "<a href='https://earthquake.usgs.gov/' target='_blank'>  Earthquake data © U.S. Geological Survey </a>",
  });

  map.addLayer({
    id: "earthquakes",
    type: "circle",
    source: "usgs",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["get", "mag"],
        0,
        0.1,
        7,
        8,
      ],
      "circle-opacity": 0,
      "circle-stroke-color": "red",
      "circle-stroke-width": 1,
    },
  });
});
