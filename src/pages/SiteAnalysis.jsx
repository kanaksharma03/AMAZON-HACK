import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Wrench,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react';
import { useBhujalStore } from '../store/useBhujalStore';
import { formatCoordinates, formatDischarge, formatArea } from '../utils/formatters';

export default function SiteAnalysis() {
  const navigate = useNavigate();
  const {
    regions,
    selectedRegionId,
    setSelectedRegionId,
    sites,
    selectedSiteId,
    setSelectedSiteId,
    settings,
  } = useBhujalStore();

  const regionSites = sites.filter((s) => s.regionId === selectedRegionId);
  const site =
    sites.find((s) => s.id === selectedSiteId) || regionSites[0] || sites[0];

  const handleSiteChange = (newSiteId) => {
    const target = sites.find((s) => s.id === newSiteId);
    if (target && target.regionId !== selectedRegionId) {
      setSelectedRegionId(target.regionId);
    }
    setSelectedSiteId(newSiteId);
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <section className="bg-white border border-slate-200 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="w-full sm:w-80">
            <label htmlFor="site-selector" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Select Site for Detailed Hydro-Geomorphic Analysis
            </label>
            <select
              id="site-selector"
              value={site.id}
              onChange={(e) => handleSiteChange(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2563EB]"
            >
              {regions.map((reg) => (
                <optgroup key={reg.id} label={`${reg.name} (${reg.state})`}>
                  {sites
                    .filter((s) => s.regionId === reg.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} — {s.name} ({s.suitabilityCategory})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-600 sm:pt-4">
            <div>
              <strong>Hamlet:</strong> {site.tribalHamlet} · <strong>GP:</strong> {site.gramPanchayat} ·{' '}
              <strong>Watershed:</strong> <span className="font-mono">{site.watershedCode}</span>
            </div>
            <div className="font-mono text-[11px] text-slate-500 mt-0.5">
              WGS84: {formatCoordinates(site.coordinates.lat, site.coordinates.lon, settings.coordinateFormat)} ·{' '}
              Elevation: {site.elevationM} m ASL
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/spatial-explorer')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded whitespace-nowrap"
          >
            View on GIS Map
          </button>
          <button
            type="button"
            onClick={() => navigate('/intervention-planner')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded flex items-center gap-1.5 whitespace-nowrap"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Plan Interventions</span>
          </button>
        </div>
      </section>

      {/* Mandatory Safety & Feasibility Assessment Banner */}
      <section
        className={`rounded border p-4 ${
          site.safetyAssessment.passed
            ? 'bg-white border-slate-200'
            : 'bg-red-50 border-red-300'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {site.safetyAssessment.passed ? (
              <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-[#B91C1C] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className={`text-sm font-bold ${
                    site.safetyAssessment.passed ? 'text-slate-900' : 'text-[#B91C1C]'
                  }`}
                >
                  {site.safetyAssessment.passed
                    ? 'Mandatory Safety & Feasibility Screening: PASSED'
                    : `MANDATORY SAFETY VETO ACTIVE — Overrides Raw AHP Heuristic Score (${site.suitabilityScore}/100)`}
                </h2>
                <span className="text-xs text-slate-500">
                  · Verification Status: <strong>{site.verificationStatus}</strong>
                </span>
              </div>
              <p
                className={`text-xs mt-1 ${
                  site.safetyAssessment.passed ? 'text-slate-600' : 'text-red-900 font-medium'
                }`}
              >
                {site.safetyAssessment.passed
                  ? site.safetyAssessment.safetyNotes
                  : `${site.safetyAssessment.vetoReason} ${site.safetyAssessment.safetyNotes}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-5 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Slope Gradient</span>
              <span
                className={`font-mono font-bold ${
                  site.safetyAssessment.slopeDeg > 35 ? 'text-[#B91C1C]' : 'text-slate-900'
                }`}
              >
                {site.safetyAssessment.slopeDeg}° (Limit 35°)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Landslide Risk</span>
              <span
                className={`font-semibold ${
                  site.safetyAssessment.landslideRisk === 'High'
                    ? 'text-[#B91C1C]'
                    : 'text-slate-900'
                }`}
              >
                {site.safetyAssessment.landslideRisk}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Sanitary Buffer</span>
              <span
                className={`font-mono font-bold ${
                  site.safetyAssessment.contaminationBufferM < 50
                    ? 'text-[#B91C1C]'
                    : 'text-slate-900'
                }`}
              >
                {site.safetyAssessment.contaminationBufferM} m (Min 50m)
              </span>
            </div>
          </div>
        </div>
      </section>

      {site.missingDataWarnings && site.missingDataWarnings.length > 0 && (
        <section className="bg-amber-50 border border-amber-300 rounded p-4">
          <div className="flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                Data Completeness &amp; Field Verification Warnings for {site.id}:
              </span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
                {site.missingDataWarnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Recharge Suitability Score &amp; Factor-Level Explanation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prototype Multi-Criteria AHP Heuristic · Weighted linear combination of 5 hydro-geomorphic criteria
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {site.suitabilityScore}
                  <span className="text-sm font-normal text-slate-400">/100</span>
                </div>
                <div
                  className={`text-xs font-semibold ${
                    !site.safetyAssessment.passed
                      ? 'text-[#B91C1C]'
                      : site.suitabilityCategory === 'High'
                      ? 'text-[#15803D]'
                      : 'text-[#2563EB]'
                  }`}
                >
                  Category: {site.suitabilityCategory}
                </div>
              </div>
            </div>

            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <strong>Methodological Disclosure:</strong> This score is computed via a prototype
                Analytic Hierarchy Process (AHP) heuristic formula:{' '}
                <code className="font-mono text-[11px] bg-white px-1 py-0.5 border border-slate-200 rounded">
                  S = 0.25(Lineament) + 0.20(Slope) + 0.20(Regolith) + 0.15(Infiltration) + 0.20(Vulnerability)
                </code>
                . It is <strong>not</strong> a trained or field-validated machine learning prediction.
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <th className="py-2 px-2.5 font-semibold">Hydro-Geomorphic Factor</th>
                    <th className="py-2 px-2.5 font-semibold text-right">Weight</th>
                    <th className="py-2 px-2.5 font-semibold">Observed / Proxy Value</th>
                    <th className="py-2 px-2.5 font-semibold text-right">Sub-Score</th>
                    <th className="py-2 px-2.5 font-semibold text-right">Contribution</th>
                    <th className="py-2 px-2.5 font-semibold">Data Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {site.factorBreakdown.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-2.5 font-medium text-slate-900">{f.factor}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-600">
                        {(f.weight * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-slate-800">{f.rawValue}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono tabular-nums">
                        {f.normalizedScore}/100
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono tabular-nums font-bold text-[#15803D]">
                        {f.contribution}
                      </td>
                      <td className="py-2.5 px-2.5 text-[11px] text-slate-600">{f.provenance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Normalized Parameter Sub-Scores (0–100 Scale)
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={site.factorBreakdown}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="factor"
                    width={175}
                    tick={{ fontSize: 11, fill: '#334155' }}
                  />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="normalizedScore"
                    name="Normalized Sub-Score"
                    fill="#2563EB"
                    radius={[0, 3, 3, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded p-5">
            <h3 className="text-base font-bold text-slate-900">
              Terrain, Lithology &amp; Hydrogeological Attributes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">
              Distinguishing remote-sensing terrain derivatives from field measurements
            </p>

            <dl className="divide-y divide-slate-200 text-xs border-t border-b border-slate-200">
              <div className="py-2 flex justify-between gap-2">
                <dt className="text-slate-500">Host Rock Lithology</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {site.terrainAndLithology.lithology}
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-2">
                <dt className="text-slate-500">Distance to Structural Lineament</dt>
                <dd className="font-mono text-slate-900">
                  {site.terrainAndLithology.lineamentDistanceM} m{' '}
                  <span className="text-[11px] text-slate-400">(Proxy)</span>
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-2">
                <dt className="text-slate-500">Weathered Regolith Thickness</dt>
                <dd className="font-mono text-slate-900">
                  {site.terrainAndLithology.weatheringDepthM} m
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-2">
                <dt className="text-slate-500">Catchment Area &amp; TWI</dt>
                <dd className="font-mono text-slate-900">
                  {formatArea(site.terrainAndLithology.catchmentAreaHa, settings.areaUnit)} · TWI{' '}
                  {site.terrainAndLithology.twi}
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-2">
                <dt className="text-slate-500">Drainage Density</dt>
                <dd className="font-mono text-slate-900">
                  {site.terrainAndLithology.drainageDensityKmKm2} km/km²
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-2">
                <dt className="text-slate-500">Land Use / Land Cover (LULC)</dt>
                <dd className="text-slate-900 text-right">{site.terrainAndLithology.landUse}</dd>
              </div>
              <div className="py-2 flex justify-between gap-2">
                <dt className="text-slate-500">Soil Texture &amp; Infiltration</dt>
                <dd className="font-mono text-slate-900 text-right">
                  {site.terrainAndLithology.soilTexture} ({site.terrainAndLithology.infiltrationRateMmHr} mm/hr)
                </dd>
              </div>
              <div className="py-2 flex justify-between gap-2">
                <dt className="text-slate-500">Pre-Monsoon LST Heat Anomaly</dt>
                <dd className="font-mono font-semibold text-[#B45309]">
                  +{site.terrainAndLithology.lstAnomalyC}°C above watershed forest mean
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white border border-slate-200 rounded p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Spring Discharge &amp; Water Quality
                </h3>
                <p className="text-xs text-slate-500">
                  Provenance: {site.hydrology.waterQuality.provenance}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/spring-monitoring')}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                Monitoring Log →
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Pre-Monsoon Flow</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {formatDischarge(site.hydrology.preMonsoonDischargeLpm, settings.dischargeUnit)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Post-Monsoon Flow</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {formatDischarge(site.hydrology.postMonsoonDischargeLpm, settings.dischargeUnit)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Seasonal Decay</span>
                <span className="font-mono font-bold text-sm text-[#B91C1C]">
                  {site.hydrology.dischargeDecayRatePct}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
              <div className="p-2 border border-slate-200 rounded">
                <span className="text-slate-500 block text-[10px]">pH</span>
                <span className="font-mono font-semibold">
                  {site.hydrology.waterQuality.ph ?? 'Unrecorded'}
                </span>
              </div>
              <div className="p-2 border border-slate-200 rounded">
                <span className="text-slate-500 block text-[10px]">TDS (mg/L)</span>
                <span className="font-mono font-semibold">
                  {site.hydrology.waterQuality.tdsMgL ?? 'Unrecorded'}
                </span>
              </div>
              <div className="p-2 border border-slate-200 rounded">
                <span className="text-slate-500 block text-[10px]">EC (µS/cm)</span>
                <span className="font-mono font-semibold">
                  {site.hydrology.waterQuality.ecUsCm ?? 'Unrecorded'}
                </span>
              </div>
              <div className="p-2 border border-slate-200 rounded">
                <span className="text-slate-500 block text-[10px]">Nitrate (mg/L)</span>
                <span
                  className={`font-mono font-semibold ${
                    (site.hydrology.waterQuality.nitrateMgL || 0) > 20
                      ? 'text-[#B91C1C]'
                      : 'text-slate-900'
                  }`}
                >
                  {site.hydrology.waterQuality.nitrateMgL ?? 'Unrecorded'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-5">
            <h3 className="text-sm font-bold text-slate-900">
              Recommended Next Steps for {site.id}
            </h3>
            <ul className="mt-2.5 space-y-2 text-xs text-slate-700">
              {!site.safetyAssessment.passed ? (
                <>
                  <li>
                    1. <strong>Enforce Excavation Prohibition:</strong> Do not excavate trenches or
                    percolation pits on this site due to the active safety veto.
                  </li>
                  <li>
                    2. <strong>Evaluate Non-Invasive Protection:</strong> Use the Intervention
                    Planner to configure vegetative spring sanctuary protection or downstream
                    spring-box capture.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    1. <strong>Configure Recharge Structures:</strong> Compare eligible interventions
                    (e.g., Contour Trenches, Percolation Pond, Sub-Surface Dyke) in the Intervention
                    Planner.
                  </li>
                  <li>
                    2. <strong>Verify Recharge Zone Boundary:</strong> Confirm geological strike/dip
                    and fracture aperture with field hydrogeologist before finalizing layout.
                  </li>
                </>
              )}
              {site.hydrology.historicalObservations.length < 2 && (
                <li className="text-[#B45309] font-medium">
                  3. <strong>Log Baseline Field Measurement:</strong> Historical discharge records
                  are sparse ({site.hydrology.historicalObservations.length} record). Submit a
                  pre-monsoon measurement in Field Verification.
                </li>
              )}
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => navigate('/field-verification')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded flex items-center gap-1.5"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Log Field Verification</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/intervention-planner')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded flex items-center gap-1.5"
              >
                <span>Proceed to Intervention Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
