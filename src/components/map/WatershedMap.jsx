import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Compass,
  Maximize2,
} from 'lucide-react';
import { buildRegionGeoJsonLayers } from '../../data/demoDataset';
import { formatCoordinates, formatDischarge } from '../../utils/formatters';

function buildMapStyle(styleKey = 'carto-positron') {
  const tileUrlMap = {
    'carto-positron': [
      'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    ],
    'carto-voyager': [
      'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    ],
    'osm-topo': ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
  };

  const tiles = tileUrlMap[styleKey] || tileUrlMap['carto-positron'];

  return {
    version: 8,
    sources: {
      'raster-basemap': {
        type: 'raster',
        tiles,
        tileSize: 256,
        attribution: '© OpenStreetMap contributors, © CARTO',
      },
    },
    layers: [
      {
        id: 'basemap-layer',
        type: 'raster',
        source: 'raster-basemap',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}

export function getMarkerColor(site, colorBy = 'suitability') {
  if (colorBy === 'dryingRisk') {
    if (site.dryingRisk === 'Critical') return '#B91C1C';
    if (site.dryingRisk === 'High') return '#D97706';
    if (site.dryingRisk === 'Moderate') return '#2563EB';
    return '#15803D';
  }
  if (colorBy === 'verification') {
    if (site.verificationStatus === 'Verified') return '#15803D';
    if (site.verificationStatus?.includes('Flagged')) return '#B91C1C';
    if (site.verificationStatus?.includes('Pending')) return '#D97706';
    return '#64748B';
  }
  if (!site.safetyAssessment.passed || site.suitabilityCategory === 'Safety Restricted') {
    return '#B91C1C';
  }
  if (site.suitabilityCategory === 'High') return '#15803D';
  if (site.suitabilityCategory === 'Moderate') return '#2563EB';
  return '#B45309';
}

export default function WatershedMap({
  region,
  sites,
  allRegionSites,
  selectedSiteId,
  onSelectSite,
  mapLayers,
  colorBy = 'suitability',
  basemapStyle = 'carto-positron',
  coordinateFormat = 'DD',
  dischargeUnit = 'LPM',
  compact = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [tileError, setTileError] = useState(false);
  const [useSchematicFallback, setUseSchematicFallback] = useState(
    basemapStyle === 'schematic-fallback'
  );
  const [cursorCoords, setCursorCoords] = useState(region.center);

  useEffect(() => {
    setUseSchematicFallback(basemapStyle === 'schematic-fallback');
  }, [basemapStyle]);

  useEffect(() => {
    if (useSchematicFallback || !mapContainerRef.current) return;

    let map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: buildMapStyle(basemapStyle),
        center: [region.center.lon, region.center.lat],
        zoom: compact ? region.zoom - 0.6 : region.zoom,
        attributionControl: !compact,
      });

      mapInstanceRef.current = map;

      map.on('mousemove', (e) => {
        setCursorCoords({
          lat: Number(e.lngLat.lat.toFixed(4)),
          lon: Number(e.lngLat.lng.toFixed(4)),
        });
      });

      map.on('error', (err) => {
        if (err && err.error && String(err.error.message || '').includes('Failed to fetch')) {
          setTileError(true);
        }
      });

      map.on('load', () => {
        const geojson = buildRegionGeoJsonLayers(region.id, allRegionSites || sites);

        map.addSource('heat-zones', {
          type: 'geojson',
          data: geojson.heatZones,
        });
        map.addLayer({
          id: 'heat-zones-fill',
          type: 'fill',
          source: 'heat-zones',
          layout: {
            visibility: mapLayers?.heatZones !== false ? 'visible' : 'none',
          },
          paint: {
            'fill-color': '#F59E0B',
            'fill-opacity': 0.14,
          },
        });
        map.addLayer({
          id: 'heat-zones-outline',
          type: 'line',
          source: 'heat-zones',
          layout: {
            visibility: mapLayers?.heatZones !== false ? 'visible' : 'none',
          },
          paint: {
            'line-color': '#D97706',
            'line-width': 1.2,
            'line-dasharray': [3, 3],
          },
        });

        map.addSource('catchments', {
          type: 'geojson',
          data: geojson.catchments,
        });
        map.addLayer({
          id: 'catchments-fill',
          type: 'fill',
          source: 'catchments',
          layout: {
            visibility: mapLayers?.catchments !== false ? 'visible' : 'none',
          },
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 'safetyPassed'], false],
              '#FEE2E2',
              ['==', ['get', 'suitabilityCategory'], 'High'],
              '#DCFCE7',
              '#DBEAFE',
            ],
            'fill-opacity': 0.38,
          },
        });
        map.addLayer({
          id: 'catchments-outline',
          type: 'line',
          source: 'catchments',
          layout: {
            visibility: mapLayers?.catchments !== false ? 'visible' : 'none',
          },
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'safetyPassed'], false],
              '#B91C1C',
              ['==', ['get', 'suitabilityCategory'], 'High'],
              '#15803D',
              '#2563EB',
            ],
            'line-width': 1.5,
          },
        });

        map.addSource('lineaments', {
          type: 'geojson',
          data: geojson.lineaments,
        });
        map.addLayer({
          id: 'lineaments-line',
          type: 'line',
          source: 'lineaments',
          layout: {
            visibility: mapLayers?.lineaments !== false ? 'visible' : 'none',
          },
          paint: {
            'line-color': '#1D4ED8',
            'line-width': 2,
            'line-dasharray': [4, 2],
          },
        });
      });
    } catch (e) {
      setTileError(true);
      setUseSchematicFallback(true);
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (map) {
        map.remove();
      }
      mapInstanceRef.current = null;
    };
  }, [region.id, basemapStyle, useSchematicFallback, compact]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const setVis = (layerId, visible) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };

    setVis('catchments-fill', mapLayers?.catchments !== false);
    setVis('catchments-outline', mapLayers?.catchments !== false);
    setVis('lineaments-line', mapLayers?.lineaments !== false);
    setVis('heat-zones-fill', mapLayers?.heatZones !== false);
    setVis('heat-zones-outline', mapLayers?.heatZones !== false);
  }, [mapLayers]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || useSchematicFallback) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (mapLayers?.sites === false) return;

    sites.forEach((site) => {
      const isSelected = site.id === selectedSiteId;
      const color = getMarkerColor(site, colorBy);

      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', `Select site ${site.name}`);
      el.style.width = isSelected ? '26px' : '20px';
      el.style.height = isSelected ? '26px' : '20px';
      el.style.borderRadius = !site.safetyAssessment.passed ? '4px' : '9999px';
      el.style.backgroundColor = color;
      el.style.border = isSelected ? '3px solid #0F172A' : '2px solid #FFFFFF';
      el.style.boxShadow = isSelected
        ? '0 0 0 3px rgba(37, 99, 235, 0.35)'
        : '0 1px 4px rgba(15, 23, 42, 0.35)';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = '#FFFFFF';
      el.style.fontSize = '10px';
      el.style.fontWeight = '700';
      el.style.fontFamily = 'JetBrains Mono, monospace';
      el.textContent = !site.safetyAssessment.passed ? '!' : String(site.suitabilityScore);

      const popupHtml = `
        <div style="min-width: 210px;">
          <div style="font-size: 11px; color: #64748B; font-family: monospace;">${site.id} · ${site.siteType}</div>
          <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-top: 2px;">${site.name}</div>
          <div style="font-size: 11px; color: #334155; margin-top: 2px;">Hamlet: ${site.tribalHamlet}</div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 11px; display: flex; justify-content: space-between;">
            <span>Suitability: <strong>${site.suitabilityScore}/100 (${site.suitabilityCategory})</strong></span>
          </div>
          <div style="font-size: 11px; margin-top: 2px;">
            Pre-Monsoon Flow: <strong>${formatDischarge(site.hydrology.preMonsoonDischargeLpm, dischargeUnit)}</strong>
          </div>
          ${
            !site.safetyAssessment.passed
              ? `<div style="margin-top: 6px; padding: 4px 6px; background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; font-size: 10px; font-weight: 600; border-radius: 4px;">
                  SAFETY VETO: Excavation Prohibited
                </div>`
              : ''
          }
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 14, closeButton: true }).setHTML(popupHtml);

      el.addEventListener('click', () => {
        if (onSelectSite) onSelectSite(site.id);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([site.coordinates.lon, site.coordinates.lat])
        .setPopup(popup)
        .addTo(map);

      if (isSelected && !compact) {
        marker.togglePopup();
      }

      markersRef.current.push(marker);
    });
  }, [sites, selectedSiteId, colorBy, mapLayers?.sites, useSchematicFallback, dischargeUnit, compact]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [region.center.lon, region.center.lat],
        zoom: compact ? region.zoom - 0.6 : region.zoom,
        bearing: 0,
        pitch: 0,
      });
    }
  };

  if (useSchematicFallback) {
    const [minLon, minLat, maxLon, maxLat] = region.bbox;
    const projectPoint = (lat, lon) => {
      const xPct = ((lon - minLon) / (maxLon - minLon)) * 84 + 8;
      const yPct = (1 - (lat - minLat) / (maxLat - minLat)) * 80 + 10;
      return {
        x: Math.max(6, Math.min(94, xPct)),
        y: Math.max(8, Math.min(92, yPct)),
      };
    };

    return (
      <div className="relative w-full h-full bg-slate-100 border border-slate-200 rounded overflow-hidden flex flex-col">
        <div className="bg-white/95 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Compass className="w-4 h-4 text-[#2563EB]" />
            <span className="font-semibold">
              WGS84 Schematic Coordinate Grid ({region.name})
            </span>
            {tileError && (
              <span className="text-[#B45309] font-medium">
                · External tile service unreachable; displaying accurate WGS84 coordinate projection
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setTileError(false);
              setUseSchematicFallback(false);
            }}
            className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded"
          >
            Try MapLibre Basemap Tiles
          </button>
        </div>

        <div className="relative flex-1 bg-[#F1F5F9]">
          <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <defs>
              <pattern id="gis-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path
                  d="M 100 0 L 0 0 0 100"
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth="0.8"
                  strokeDasharray="3,3"
                />
              </pattern>
            </defs>
            <rect width="1000" height="600" fill="url(#gis-grid)" />

            {sites.map((site, idx) => {
              const pt = projectPoint(site.coordinates.lat, site.coordinates.lon);
              const cx = pt.x * 10;
              const cy = pt.y * 6;
              return (
                <g key={site.id}>
                  {mapLayers?.heatZones !== false && site.terrainAndLithology.lstAnomalyC >= 2.0 && (
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx="85"
                      ry="55"
                      fill="#F59E0B"
                      fillOpacity="0.14"
                      stroke="#D97706"
                      strokeWidth="1.2"
                      strokeDasharray="4,4"
                    />
                  )}
                  {mapLayers?.catchments !== false && (
                    <polygon
                      points={`${cx - 55},${cy - 25} ${cx + 15},${cy - 50} ${cx + 65},${cy + 10} ${cx + 25},${cy + 45} ${cx - 45},${cy + 30}`}
                      fill={!site.safetyAssessment.passed ? '#FEE2E2' : '#DBEAFE'}
                      fillOpacity="0.55"
                      stroke={!site.safetyAssessment.passed ? '#B91C1C' : '#2563EB'}
                      strokeWidth="1.5"
                    />
                  )}
                  {mapLayers?.lineaments !== false && (
                    <line
                      x1={cx - 90}
                      y1={cy + (idx % 2 === 0 ? -45 : 45)}
                      x2={cx + 90}
                      y2={cy + (idx % 2 === 0 ? 45 : -45)}
                      stroke="#1D4ED8"
                      strokeWidth="2"
                      strokeDasharray="6,4"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {mapLayers?.sites !== false &&
            sites.map((site) => {
              const pt = projectPoint(site.coordinates.lat, site.coordinates.lon);
              const isSelected = site.id === selectedSiteId;
              const color = getMarkerColor(site, colorBy);

              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => onSelectSite && onSelectSite(site.id)}
                  style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center focus:outline-none z-10`}
                >
                  <div
                    style={{ backgroundColor: color }}
                    className={`flex items-center justify-center text-white font-mono text-xs font-bold transition-transform ${
                      !site.safetyAssessment.passed ? 'rounded' : 'rounded-full'
                    } ${
                      isSelected
                        ? 'w-8 h-8 ring-4 ring-[#2563EB]/40 border-2 border-slate-900 scale-110'
                        : 'w-6 h-6 border-2 border-white shadow'
                    }`}
                  >
                    {!site.safetyAssessment.passed ? '!' : site.suitabilityScore}
                  </div>
                  <span
                    className={`mt-1 px-1.5 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white/95 text-slate-800 border-slate-300'
                    }`}
                  >
                    {site.id} · {site.name}
                  </span>
                </button>
              );
            })}
        </div>

        <div className="bg-white border-t border-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-600 font-mono tabular-nums">
          <span>
            Bounds: {formatCoordinates(minLat, minLon, coordinateFormat)} to{' '}
            {formatCoordinates(maxLat, maxLon, coordinateFormat)}
          </span>
          <span>CRS: EPSG:4326 (WGS84)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-100 rounded overflow-hidden border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full" />

      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-white border border-slate-300 rounded p-1 shadow-xs">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          aria-label="Zoom In"
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          title="Reset Study Region View"
          aria-label="Reset Study Region View"
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded border-t border-slate-200"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setUseSchematicFallback(true)}
          title="Switch to Schematic WGS84 Grid View"
          aria-label="Switch to Schematic WGS84 Grid View"
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded border-t border-slate-200"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {tileError && (
        <div className="absolute top-3 left-3 right-14 z-10 bg-amber-50 border border-amber-300 rounded px-3 py-2 flex items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
            <span>
              External raster map tiles could not be reached. Switch to the built-in WGS84 Vector
              Grid to inspect spatial features without internet tile dependencies.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setUseSchematicFallback(true)}
            className="px-2.5 py-1 bg-[#B45309] text-white font-semibold rounded whitespace-nowrap"
          >
            Open WGS84 Grid
          </button>
        </div>
      )}

      <div className="absolute bottom-2.5 left-2.5 z-10 bg-white/95 border border-slate-300 rounded px-2.5 py-1 text-[11px] font-mono tabular-nums text-slate-700">
        Cursor: {formatCoordinates(cursorCoords.lat, cursorCoords.lon, coordinateFormat)} · EPSG:4326
      </div>
    </div>
  );
}
