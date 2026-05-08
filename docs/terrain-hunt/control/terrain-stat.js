class TerrainStatControl {
  constructor(options = {}) {
    this.options = {
      demTileUrl: options.demTileUrl,
      slopeTileUrl: options.slopeTileUrl,
      demEncoding: options.demEncoding,

      // optional
      demSource: options.demSource,

      ...options,
    };

    this._onMoveEnd = this._onMoveEnd.bind(this);

    this._lastTileKey = null;

    this.slopeBins = [
      [0, 5],
      [5, 10],
      [10, 15],
      [15, 20],
      [20, 25],
      [25, 30],
      [30, 35],
      [35, 40],
      [40, 45],
      [45, Infinity],
    ];
  }

  onAdd(map) {
    this.map = map;

    this._buildUI();
    this._renderEmpty();

    map.on("moveend", this._onMoveEnd);
    map.on("zoomend", this._onMoveEnd);

    this._onMoveEnd();

    return this.container;
  }

  onRemove() {
    this.map.off("moveend", this._onMoveEnd);
    this.map.off("zoomend", this._onMoveEnd);

    this.container.remove();

    this.map = undefined;
  }

  _buildUI() {
    const container = document.createElement("div");

    container.className = "maplibregl-ctrl maplibregl-ctrl-group";

    container.style.padding = "8px";
    container.style.fontSize = "12px";
    container.style.background = "white";
    container.style.minWidth = "0";
    container.style.minHeight = "140px";

    this.container = container;

    this.content = document.createElement("div");

    container.appendChild(this.content);
  }

  _renderEmpty() {
    let html = "";

    html += `<div>Elevation diff: -</div>`;
    html += `<div style="margin-top:6px;">Slope:</div>`;

    this.slopeBins.forEach(([min, max]) => {
      const label = max === Infinity ? `${min}°+` : `${min}°–${max}°`;

      html += `<div>${label}: -</div>`;
    });

    this.content.innerHTML = html;
  }

  async _onMoveEnd() {
    const tiles = this._getVisibleTiles();

    const tileKey = JSON.stringify(tiles);

    if (tileKey === this._lastTileKey) {
      return;
    }

    this._lastTileKey = tileKey;

    const demStats = await this._computeDEM(tiles);
    const slopeStats = await this._computeSlope(tiles);

    this._render(demStats, slopeStats);
  }

  _getVisibleTiles() {
    const bounds = this.map.getBounds();
    const zoom = Math.floor(this.map.getZoom());
    const tiles = [];
    const tileCount = Math.pow(2, zoom);
    const lngLatToTile = (lng, lat) => {
      const x = ((lng + 180) / 360) * tileCount;
      const y =
        ((1 -
          Math.log(
            Math.tan((lat * Math.PI) / 180) +
              1 / Math.cos((lat * Math.PI) / 180),
          ) /
            Math.PI) /
          2) *
        tileCount;
      return {
        x: Math.floor(x),
        y: Math.floor(y),
      };
    };

    const nw = lngLatToTile(bounds.getWest(), bounds.getNorth());
    const se = lngLatToTile(bounds.getEast(), bounds.getSouth());

    for (let x = nw.x; x <= se.x; x++) {
      for (let y = nw.y; y <= se.y; y++) {
        tiles.push({
          z: zoom,
          x,
          y,
        });
      }
    }

    return tiles;
  }

  async _computeDEM(tiles) {
    // -------------------------
    // shared DEM path
    // -------------------------

    if (this.options.demSource) {
      return this._computeDEMFromSharedCache(tiles);
    }

    // -------------------------
    // fallback: URL tiles
    // -------------------------

    return this._computeDEMFromURL(tiles);
  }

  async _computeDEMFromSharedCache(tiles) {
    let min = Infinity;
    let max = -Infinity;

    await Promise.all(
      tiles.map(async (t) => {
        try {
          const abortController = new AbortController();

          const demTile =
            await this.options.demSource.manager.fetchAndParseTile(
              t.z,
              t.x,
              t.y,
              abortController,
            );

          const data = demTile.data;

          for (let i = 0; i < data.length; i++) {
            const elevation = data[i];

            if (!isFinite(elevation)) continue;

            if (elevation < min) min = elevation;

            if (elevation > max) max = elevation;
          }
        } catch {}
      }),
    );

    return {
      min,
      max,
      diff: max - min,
    };
  }

  async _computeDEMFromURL(tiles) {
    let min = Infinity;
    let max = -Infinity;

    await Promise.all(
      tiles.map(async (t) => {
        const url = this._tileURL(this.options.demTileUrl, t);

        try {
          const img = await this._loadImage(url);

          const data = this._getImageData(img);

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            let elevation;

            if (this.options.demEncoding === "terrarium") {
              elevation = this._decodeTerrarium(r, g, b);
            }

            if (this.options.demEncoding === "mapbox") {
              elevation = this._decodeTerrainRGB(r, g, b);
            }

            if (!isFinite(elevation)) continue;

            if (elevation < min) min = elevation;

            if (elevation > max) max = elevation;
          }
        } catch {}
      }),
    );

    return {
      min,
      max,
      diff: max - min,
    };
  }

  async _computeSlope(tiles) {
    const bins = new Array(this.slopeBins.length).fill(0);

    let total = 0;

    await Promise.all(
      tiles.map(async (t) => {
        const url = this._tileURL(this.options.slopeTileUrl, t);

        try {
          const img = await this._loadImage(url);

          const data = this._getImageData(img);

          for (let i = 0; i < data.length; i += 4) {
            const v = data[i];

            if (v === 0) continue;

            const slope = ((255 - v) / 255) * 90;

            for (let b = 0; b < this.slopeBins.length; b++) {
              const [min, max] = this.slopeBins[b];

              if (slope >= min && slope < max) {
                bins[b]++;

                break;
              }
            }

            total++;
          }
        } catch {}
      }),
    );

    return bins.map((count, i) => {
      const pct = total ? (count / total) * 100 : 0;

      return {
        range: this.slopeBins[i],
        pct,
      };
    });
  }

  _render(dem, slope) {
    let html = "";

    if (isFinite(dem.diff)) {
      html += `<div>Elevation diff: ${dem.diff.toFixed(0)} m</div>`;
    } else {
      html += `<div>Elevation diff: -</div>`;
    }

    html += `<div style="margin-top:6px;">Slope:</div>`;

    slope.forEach((b) => {
      const [min, max] = b.range;

      const label = max === Infinity ? `${min}°+` : `${min}°–${max}°`;

      html += `<div>${label}: ${b.pct.toFixed(1)}%</div>`;
    });

    this.content.innerHTML = html;
  }

  _tileURL(template, { z, x, y }) {
    return template.replace("{z}", z).replace("{x}", x).replace("{y}", y);
  }

  _loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.crossOrigin = "anonymous";

      img.onload = () => resolve(img);

      img.onerror = reject;

      img.src = url;
    });
  }

  _getImageData(img) {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");

      this.ctx = this.canvas.getContext("2d");
    }

    this.canvas.width = img.width;
    this.canvas.height = img.height;

    this.ctx.drawImage(img, 0, 0);

    return this.ctx.getImageData(0, 0, img.width, img.height).data;
  }

  _decodeTerrarium(r, g, b) {
    return r * 256 + g + b / 256 - 32768;
  }

  _decodeTerrainRGB(r, g, b) {
    return (r * 256 * 256 + g * 256 + b) * 0.1 - 10000;
  }
}

export default TerrainStatControl;
