import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server,
  Map,
  RotateCcw,
  RefreshCw,
  Database,
} from 'lucide-react';
import { useBhujalStore } from '../store/useBhujalStore';

export default function Settings() {
  const navigate = useNavigate();
  const {
    regions,
    selectedRegionId,
    setSelectedRegionId,
    dataMode,
    setDataMode,
    apiBaseUrl,
    setApiBaseUrl,
    liveApiStatus,
    testLiveApiConnection,
    settings,
    updateSettings,
    resetAllDemoData,
  } = useBhujalStore();

  const [resetNotice, setResetNotice] = useState('');

  const handleResetDemo = () => {
    resetAllDemoData();
    setResetNotice(
      'All demonstration sites, field verification logs, shortlisted interventions, and scenario parameters have been restored to their initial baseline.'
    );
    setTimeout(() => setResetNotice(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      {/* 1. Data Mode & Backend API Configuration */}
      <section className="bg-white border border-slate-200 rounded p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-[#2563EB]" />
              <span>Data Source Mode &amp; Backend API Connection</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Switch between the self-contained SIH 26240 Demonstration Dataset and a live backend
              API endpoint. BHUJAL never silently substitutes demo data if a live API fails.
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold ${
              dataMode === 'demo'
                ? 'bg-slate-100 text-slate-800 border border-slate-300'
                : liveApiStatus.ok
                ? 'bg-emerald-50 text-[#15803D] border border-emerald-300'
                : 'bg-red-50 text-[#B91C1C] border border-red-300'
            }`}
          >
            Active Mode: {dataMode.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Mode Radio Cards */}
          <div className="space-y-2.5">
            <div className="font-semibold text-slate-700">Select Platform Data Mode</div>
            <label
              className={`block p-3.5 rounded border cursor-pointer transition-colors ${
                dataMode === 'demo'
                  ? 'bg-blue-50/50 border-[#2563EB]'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <input
                  type="radio"
                  name="dataMode"
                  checked={dataMode === 'demo'}
                  onChange={() => setDataMode('demo')}
                  className="text-[#2563EB]"
                />
                <span>Curated Demonstration Dataset (Default SIH 26240)</span>
              </div>
              <p className="text-slate-600 mt-1 pl-5">
                Uses local provenance-tagged sample records across Odisha, Madhya Pradesh, and
                Maharashtra tribal watersheds.
              </p>
            </label>

            <label
              className={`block p-3.5 rounded border cursor-pointer transition-colors ${
                dataMode === 'live'
                  ? 'bg-blue-50/50 border-[#2563EB]'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <input
                  type="radio"
                  name="dataMode"
                  checked={dataMode === 'live'}
                  onChange={() => setDataMode('live')}
                  className="text-[#2563EB]"
                />
                <span>Live Backend API Mode</span>
              </div>
              <p className="text-slate-600 mt-1 pl-5">
                Connects to VITE_API_BASE_URL. Displays explicit connection errors if no live backend
                is running.
              </p>
            </label>
          </div>

          {/* API Endpoint & Connection Diagnostic */}
          <div className="space-y-3">
            <div>
              <label htmlFor="api-url-input" className="block font-semibold text-slate-700 mb-1">
                Configured API Base URL (VITE_API_BASE_URL)
              </label>
              <div className="flex gap-2">
                <input
                  id="api-url-input"
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                />
                <button
                  type="button"
                  onClick={testLiveApiConnection}
                  disabled={liveApiStatus.loading}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded flex items-center gap-1.5 whitespace-nowrap"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${liveApiStatus.loading ? 'animate-spin' : ''}`}
                  />
                  <span>Test Connection</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Diagnostic Status</span>
                {liveApiStatus.lastChecked && <span>Checked: {liveApiStatus.lastChecked}</span>}
              </div>
              <div className="font-medium text-slate-800">{liveApiStatus.message}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Study Region, GIS Map & Unit Preferences */}
      <section className="bg-white border border-slate-200 rounded p-5 space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Map className="w-4 h-4 text-[#2563EB]" />
            <span>GIS Map, Study Watershed &amp; Unit Preferences</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Changes apply immediately across Overview, Spatial Explorer, Site Analysis, and Reports
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label htmlFor="set-region" className="block font-semibold text-slate-700 mb-1">
              Active Study Watershed Region
            </label>
            <select
              id="set-region"
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-slate-900"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.state})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="set-basemap" className="block font-semibold text-slate-700 mb-1">
              Default MapLibre Basemap Style
            </label>
            <select
              id="set-basemap"
              value={settings.basemapStyle}
              onChange={(e) => updateSettings({ basemapStyle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-slate-900"
            >
              <option value="carto-positron">CARTO Positron Light (Default GIS)</option>
              <option value="carto-voyager">CARTO Voyager Terrain</option>
              <option value="osm-topo">OpenStreetMap Standard Raster</option>
              <option value="schematic-fallback">
                WGS84 Vector Coordinate Grid (Zero-External-Tile Mode)
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="set-coords" className="block font-semibold text-slate-700 mb-1">
              Coordinate Display Format (EPSG:4326)
            </label>
            <select
              id="set-coords"
              value={settings.coordinateFormat}
              onChange={(e) => updateSettings({ coordinateFormat: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-slate-900"
            >
              <option value="DD">Decimal Degrees (e.g., 18.7864° N, 82.7682° E)</option>
              <option value="DMS">Degrees Minutes Seconds (e.g., 18°47&apos;11.0&quot;N)</option>
            </select>
          </div>

          <div>
            <label htmlFor="set-discharge" className="block font-semibold text-slate-700 mb-1">
              Spring Discharge Measurement Unit
            </label>
            <select
              id="set-discharge"
              value={settings.dischargeUnit}
              onChange={(e) => updateSettings({ dischargeUnit: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-slate-900"
            >
              <option value="LPM">Liters per Minute (LPM)</option>
              <option value="LPS">Liters per Second (LPS)</option>
            </select>
          </div>

          <div>
            <label htmlFor="set-area" className="block font-semibold text-slate-700 mb-1">
              Catchment Area Display Unit
            </label>
            <select
              id="set-area"
              value={settings.areaUnit}
              onChange={(e) => updateSettings({ areaUnit: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-slate-900"
            >
              <option value="HA">Hectares (Ha)</option>
              <option value="SQKM">Square Kilometers (km²)</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. Local Demonstration State Reset & Methodology Reference */}
      <section className="bg-white border border-slate-200 rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs">
          <h3 className="text-sm font-bold text-slate-900">
            Reset Local Demonstration Session State
          </h3>
          <p className="text-slate-600 mt-0.5">
            Restore all custom field verification records, shortlisted interventions, and scenario
            sliders back to the initial SIH 26240 baseline dataset.
          </p>
          {resetNotice && (
            <p className="mt-2 text-[#15803D] font-semibold">{resetNotice}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/data-methodology')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Methodology Docs</span>
          </button>
          <button
            type="button"
            onClick={handleResetDemo}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#B91C1C] bg-red-50 hover:bg-red-100 border border-red-300 rounded flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </section>
    </div>
  );
}
