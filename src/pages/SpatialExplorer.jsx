import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Layers,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useBhujalStore } from '../store/useBhujalStore';
import WatershedMap from '../components/map/WatershedMap';
import { formatCoordinates, formatDischarge, formatArea } from '../utils/formatters';

export default function SpatialExplorer() {
  const navigate = useNavigate();
  const {
    regions,
    selectedRegionId,
    sites,
    selectedSiteId,
    setSelectedSiteId,
    mapFilters,
    updateMapFilters,
    resetMapFilters,
    mapLayers,
    toggleMapLayer,
    settings,
    updateSettings,
  } = useBhujalStore();

  const activeRegion = regions.find((r) => r.id === selectedRegionId) || regions[0];
  const allRegionSites = sites.filter((s) => s.regionId === selectedRegionId);

  const filteredSites = allRegionSites.filter((site) => {
    const q = mapFilters.searchQuery.trim().toLowerCase();
    if (q) {
      const match =
        site.id.toLowerCase().includes(q) ||
        site.name.toLowerCase().includes(q) ||
        site.tribalHamlet.toLowerCase().includes(q) ||
        site.watershedCode.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (mapFilters.suitability !== 'ALL' && site.suitabilityCategory !== mapFilters.suitability) {
      return false;
    }

    if (mapFilters.dryingRisk !== 'ALL' && site.dryingRisk !== mapFilters.dryingRisk) {
      return false;
    }

    if (mapFilters.siteType !== 'ALL' && site.siteType !== mapFilters.siteType) {
      return false;
    }

    if (mapFilters.safetyStatus === 'SAFE_ONLY' && !site.safetyAssessment.passed) {
      return false;
    }
    if (mapFilters.safetyStatus === 'VETO_ONLY' && site.safetyAssessment.passed) {
      return false;
    }

    return true;
  });

  const selectedSite =
    sites.find((s) => s.id === selectedSiteId && s.regionId === selectedRegionId) ||
    filteredSites[0] ||
    allRegionSites[0];

  return (
    <div className="space-y-4 max-w-[1440px] mx-auto">
      <section className="bg-white border border-slate-200 rounded p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label htmlFor="map-search" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Search Spring / Site / Hamlet / Watershed
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
              <input
                id="map-search"
                type="text"
                value={mapFilters.searchQuery}
                onChange={(e) => updateMapFilters({ searchQuery: e.target.value })}
                placeholder="e.g., Deomali, BHJ-KRP-001, Podagada..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="filter-suitability" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Suitability Category
            </label>
            <select
              id="filter-suitability"
              value={mapFilters.suitability}
              onChange={(e) => updateMapFilters({ suitability: e.target.value })}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">All Categories ({allRegionSites.length})</option>
              <option value="High">High Suitability</option>
              <option value="Moderate">Moderate Suitability</option>
              <option value="Low">Low Suitability</option>
              <option value="Safety Restricted">Safety Restricted (Veto)</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-risk" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Spring Drying Risk
            </label>
            <select
              id="filter-risk"
              value={mapFilters.dryingRisk}
              onChange={(e) => updateMapFilters({ dryingRisk: e.target.value })}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="Critical">Critical Risk</option>
              <option value="High">High Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-type" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Hydrogeological Type
            </label>
            <select
              id="filter-type"
              value={mapFilters.siteType}
              onChange={(e) => updateMapFilters({ siteType: e.target.value })}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">All Site Types</option>
              <option value="Fracture Spring">Fracture Spring</option>
              <option value="Contact Spring">Contact Spring</option>
              <option value="Depression Spring">Depression Spring</option>
              <option value="Stream Recharge Zone">Stream Recharge Zone</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-colorby" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Marker Symbology
            </label>
            <div className="flex items-center gap-1.5">
              <select
                id="filter-colorby"
                value={mapFilters.colorBy}
                onChange={(e) => updateMapFilters({ colorBy: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:border-[#2563EB]"
              >
                <option value="suitability">Color by Suitability</option>
                <option value="dryingRisk">Color by Drying Risk</option>
                <option value="verification">Color by Verification</option>
              </select>
              <button
                type="button"
                onClick={resetMapFilters}
                title="Reset all filters"
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded shrink-0"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
              GIS Layers:
            </span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={mapLayers.sites}
                onChange={() => toggleMapLayer('sites')}
                className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span>Springs &amp; Recharge Points ({filteredSites.length})</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={mapLayers.catchments}
                onChange={() => toggleMapLayer('catchments')}
                className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span>Springshed Catchments (Polygons)</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={mapLayers.lineaments}
                onChange={() => toggleMapLayer('lineaments')}
                className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span>Structural Lineaments &amp; Faults</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={mapLayers.heatZones}
                onChange={() => toggleMapLayer('heatZones')}
                className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span>LST Heat Stress Contours (&ge; +2.0°C)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Basemap:</span>
            <select
              value={settings.basemapStyle}
              onChange={(e) => updateSettings({ basemapStyle: e.target.value })}
              className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800"
            >
              <option value="carto-positron">CARTO Light Positron</option>
              <option value="carto-voyager">CARTO Terrain Voyager</option>
              <option value="osm-topo">OpenStreetMap Standard</option>
              <option value="schematic-fallback">WGS84 Vector Grid (Offline-Ready)</option>
            </select>
          </div>
        </div>
      </section>

      {filteredSites.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
            <span>
              No springs or recharge sites in <strong>{activeRegion.name}</strong> match your active
              filter criteria.
            </span>
          </div>
          <button
            type="button"
            onClick={resetMapFilters}
            className="px-3 py-1 text-xs font-semibold bg-white border border-amber-300 text-amber-900 rounded hover:bg-amber-100"
          >
            Reset Filters
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <div className="h-[540px] w-full">
            <WatershedMap
              region={activeRegion}
              sites={filteredSites}
              allRegionSites={allRegionSites}
              selectedSiteId={selectedSite?.id}
              onSelectSite={(id) => setSelectedSiteId(id)}
              mapLayers={mapLayers}
              colorBy={mapFilters.colorBy}
              basemapStyle={settings.basemapStyle}
              coordinateFormat={settings.coordinateFormat}
              dischargeUnit={settings.dischargeUnit}
              compact={false}
            />
          </div>

          <div className="mt-3 bg-white border border-slate-200 rounded p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-slate-800">Map Legend:</span>
              {mapFilters.colorBy === 'suitability' && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#15803D] inline-block" /> High Suitability (75–100)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#2563EB] inline-block" /> Moderate (60–74)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#B45309] inline-block" /> Low (&lt;60)
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-[#B91C1C]">
                    <span className="w-3 h-3 rounded-xs bg-[#B91C1C] inline-block text-[9px] text-white text-center leading-3 font-bold">
                      !
                    </span>
                    Safety Restricted (Veto)
                  </span>
                </>
              )}
              {mapFilters.colorBy === 'dryingRisk' && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#B91C1C] inline-block" /> Critical Drying Risk
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#D97706] inline-block" /> High Drying Risk
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#2563EB] inline-block" /> Moderate Risk
                  </span>
                </>
              )}
              {mapFilters.colorBy === 'verification' && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#15803D] inline-block" /> Field Verified
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#B91C1C] inline-block" /> Safety Flagged
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#D97706] inline-block" /> Pending Field Check
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#64748B] inline-block" /> Unverified
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-[#1D4ED8] border-b border-dashed border-[#1D4ED8] inline-block" />
                Lineament / Fault
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-500/20 border border-dashed border-amber-600 inline-block" />
                +2°C LST Anomaly
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          {selectedSite ? (
            <div className="bg-white border border-slate-200 rounded p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>{selectedSite.id} · {selectedSite.watershedCode}</span>
                  <span>{selectedSite.elevationM} m ASL</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedSite.name}</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Hamlet: <strong>{selectedSite.tribalHamlet}</strong> · GP: {selectedSite.gramPanchayat}
                </p>
                <div className="mt-1 text-[11px] font-mono text-slate-500">
                  WGS84:{' '}
                  {formatCoordinates(
                    selectedSite.coordinates.lat,
                    selectedSite.coordinates.lon,
                    settings.coordinateFormat
                  )}
                </div>

                <div
                  className={`mt-4 p-3 rounded border text-xs ${
                    selectedSite.safetyAssessment.passed
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-300 text-[#B91C1C]'
                  }`}
                >
                  {selectedSite.safetyAssessment.passed ? (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">
                          Safety &amp; Feasibility Gate: Passed
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          Slope {selectedSite.safetyAssessment.slopeDeg}° · Landslide Risk:{' '}
                          {selectedSite.safetyAssessment.landslideRisk} · Buffer:{' '}
                          {selectedSite.safetyAssessment.contaminationBufferM} m
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">
                          MANDATORY SAFETY VETO (Overrides Score {selectedSite.suitabilityScore}/100)
                        </span>
                        <span className="text-[11px] block mt-0.5">
                          {selectedSite.safetyAssessment.vetoReason}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <dl className="mt-4 divide-y divide-slate-200 text-xs border-t border-b border-slate-200">
                  <div className="py-2 flex justify-between">
                    <dt className="text-slate-500">Heuristic Suitability Score</dt>
                    <dd className="font-mono font-bold text-slate-900">
                      {selectedSite.suitabilityScore}/100 ({selectedSite.suitabilityCategory})
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-slate-500">Hydrogeological Type</dt>
                    <dd className="font-medium text-slate-800">{selectedSite.siteType}</dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-slate-500">Pre-Monsoon Discharge</dt>
                    <dd className="font-mono text-slate-900">
                      {formatDischarge(
                        selectedSite.hydrology.preMonsoonDischargeLpm,
                        settings.dischargeUnit
                      )}
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-slate-500">Post-Monsoon Discharge</dt>
                    <dd className="font-mono text-slate-900">
                      {formatDischarge(
                        selectedSite.hydrology.postMonsoonDischargeLpm,
                        settings.dischargeUnit
                      )}
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-slate-500">Springshed Catchment Area</dt>
                    <dd className="font-mono text-slate-900">
                      {formatArea(
                        selectedSite.terrainAndLithology.catchmentAreaHa,
                        settings.areaUnit
                      )}
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-slate-500">Lineament Distance</dt>
                    <dd className="font-mono text-slate-900">
                      {selectedSite.terrainAndLithology.lineamentDistanceM} m
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-slate-500">Pre-Monsoon LST Anomaly</dt>
                    <dd className="font-mono text-[#B45309] font-semibold">
                      +{selectedSite.terrainAndLithology.lstAnomalyC}°C
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-slate-500">Dependent Tribal Households</dt>
                    <dd className="font-mono text-slate-900">
                      {selectedSite.beneficiaries.households} HH ({selectedSite.beneficiaries.population} pop.)
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-4 pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/site-analysis')}
                  className="w-full py-2 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Full Site Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/intervention-planner')}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-medium rounded"
                  >
                    Plan Intervention
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/field-verification')}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-medium rounded"
                  >
                    Verify in Field
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="bg-white border border-slate-200 rounded p-4">
            <div className="text-xs font-bold text-slate-800 mb-2">
              Matching Sites in View ({filteredSites.length})
            </div>
            <div className="max-h-44 overflow-y-auto divide-y divide-slate-100">
              {filteredSites.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSiteId(s.id)}
                  className={`w-full text-left py-2 px-2.5 rounded text-xs flex items-center justify-between transition-colors ${
                    s.id === selectedSite?.id
                      ? 'bg-blue-50 text-[#2563EB] font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate">
                    <span className="font-mono text-[11px] mr-1.5">{s.id}</span>
                    {s.name}
                  </span>
                  <span className="font-mono text-[11px] shrink-0 ml-2">
                    {!s.safetyAssessment.passed ? (
                      <span className="text-[#B91C1C] font-bold">VETO</span>
                    ) : (
                      `${s.suitabilityScore}/100`
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
