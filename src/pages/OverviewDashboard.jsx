import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Cell,
} from 'recharts';
import {
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useBhujalStore } from '../store/useBhujalStore';
import WatershedMap from '../components/map/WatershedMap';
import { formatCurrencyInr, formatDischarge } from '../utils/formatters';

export default function OverviewDashboard() {
  const navigate = useNavigate();
  const {
    regions,
    selectedRegionId,
    sites,
    selectedSiteId,
    setSelectedSiteId,
    plannedInterventions,
    fieldVerifications,
    settings,
  } = useBhujalStore();

  const activeRegion = regions.find((r) => r.id === selectedRegionId) || regions[0];
  const regionSites = sites.filter((s) => s.regionId === selectedRegionId);
  const regionVerifications = fieldVerifications.filter((fv) => fv.regionId === selectedRegionId);
  const regionPlans = plannedInterventions.filter((plan) =>
    regionSites.some((s) => s.id === plan.siteId)
  );

  const totalSites = regionSites.length;
  const highSuitabilityCount = regionSites.filter(
    (s) => s.suitabilityCategory === 'High' && s.safetyAssessment.passed
  ).length;
  const safetyRestrictedCount = regionSites.filter((s) => !s.safetyAssessment.passed).length;
  const criticalDryingCount = regionSites.filter(
    (s) => s.dryingRisk === 'Critical' || s.dryingRisk === 'High'
  ).length;
  const totalHouseholdsServed = regionSites.reduce(
    (acc, s) => acc + (s.beneficiaries?.households || 0),
    0
  );
  const totalPlannedRechargeM3 = regionPlans.reduce(
    (acc, p) => acc + (p.expectedRechargeM3 || 0),
    0
  );
  const totalPlannedCostInr = regionPlans.reduce(
    (acc, p) => acc + (p.estimatedCostInr || 0),
    0
  );

  const suitabilityDistData = [
    {
      category: 'High Suitability',
      count: regionSites.filter((s) => s.suitabilityCategory === 'High' && s.safetyAssessment.passed)
        .length,
      color: '#15803D',
    },
    {
      category: 'Moderate Suitability',
      count: regionSites.filter(
        (s) => s.suitabilityCategory === 'Moderate' && s.safetyAssessment.passed
      ).length,
      color: '#2563EB',
    },
    {
      category: 'Low Suitability',
      count: regionSites.filter((s) => s.suitabilityCategory === 'Low' && s.safetyAssessment.passed)
        .length,
      color: '#B45309',
    },
    {
      category: 'Safety Restricted (Veto)',
      count: safetyRestrictedCount,
      color: '#B91C1C',
    },
  ];

  const handleOpenSiteAnalysis = (siteId) => {
    setSelectedSiteId(siteId);
    navigate('/site-analysis');
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      {/* Study Region Context Header Card */}
      <section className="bg-white border border-slate-200 rounded p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Study Watershed</span>
              <span>·</span>
              <span>{activeRegion.physiography}</span>
              <span>·</span>
              <span>Tribal Communities: {activeRegion.tribalCommunities.join(', ')}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{activeRegion.name}</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              {activeRegion.summaryDescription}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/spatial-explorer')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <span>Explore GIS Layers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/scenario-simulator')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors whitespace-nowrap"
            >
              Run Climate Scenario
            </button>
          </div>
        </div>

        {/* 4-Column Compact KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-200">
          <div>
            <div className="text-xs text-slate-500 font-medium">
              Analysed Springs &amp; Recharge Sites
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {totalSites}
              </span>
              <span className="text-xs text-[#15803D] font-medium">
                {highSuitabilityCount} High Eligible
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Serving {totalHouseholdsServed} tribal households across {activeRegion.totalVillages} hamlets
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-medium">
              Spring Drying &amp; Vulnerability
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-[#B45309]">
                {criticalDryingCount} / {totalSites}
              </span>
              <span className="text-xs text-slate-600">High or Critical Risk</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Pre-monsoon discharge decay &gt;80% between Nov and May
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-medium">
              Hydro-Climatic Heat &amp; Rain Context
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                +{activeRegion.meanLstAnomalyC}°C
              </span>
              <span className="text-xs text-[#B91C1C] font-mono tabular-nums">
                {activeRegion.monsoonDeficitPct}% Rain Deficit
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Mean pre-monsoon LST anomaly · {activeRegion.annualRainfallMm} mm normal rainfall
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-medium">
              Shortlisted Intervention Portfolio
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-[#2563EB]">
                {(totalPlannedRechargeM3 / 1000).toFixed(1)}k m³
              </span>
              <span className="text-xs text-slate-600 font-mono tabular-nums">
                {formatCurrencyInr(totalPlannedCostInr)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {regionPlans.length} active site plans · {safetyRestrictedCount} site(s) under Safety Veto
            </div>
          </div>
        </div>
      </section>

      {/* Middle Row: Hydro-Climatic Regime Chart + Spatial Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Seasonal Rainfall, Recharge &amp; Spring Discharge Regime
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly water-balance partitioning (mm) vs. mean spring discharge (LPM) · Illustrative Regional Normals
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/scenario-simulator')}
                className="text-xs font-medium text-[#2563EB] hover:underline"
              >
                Simulate Monsoon Shifts →
              </button>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={activeRegion.monthlyClimate}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#334155' }} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#334155' }}
                    label={{
                      value: 'Rainfall / Recharge (mm)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 11, fill: '#64748B' },
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#1D4ED8' }}
                    label={{
                      value: 'Spring Flow (LPM)',
                      angle: 90,
                      position: 'insideRight',
                      style: { fontSize: 11, fill: '#1D4ED8' },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '6px',
                      borderColor: '#CBD5E1',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    yAxisId="left"
                    dataKey="rainfallMm"
                    name="Rainfall (mm)"
                    fill="#93C5FD"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="potentialRechargeMm"
                    name="Effective Recharge (mm)"
                    fill="#15803D"
                    radius={[2, 2, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="baselineDischargeLpm"
                    name="Mean Spring Discharge (LPM)"
                    stroke="#1D4ED8"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              <strong>Critical Stress Window:</strong> March – May (ET exceeds rainfall by &gt;3x;
              spring discharge drops to 15–20% of post-monsoon peak).
            </span>
            <span className="font-mono text-[11px] text-slate-500">Source: IMD + Watershed Balance</span>
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Watershed GIS Preview
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any marker to select site · Red square (!) indicates Safety Veto
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/spatial-explorer')}
              className="px-2.5 py-1 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded whitespace-nowrap"
            >
              Full Map Workspace →
            </button>
          </div>

          <div className="flex-1 min-h-[270px]">
            <WatershedMap
              region={activeRegion}
              sites={regionSites}
              allRegionSites={regionSites}
              selectedSiteId={selectedSiteId}
              onSelectSite={(id) => setSelectedSiteId(id)}
              mapLayers={{ sites: true, catchments: true, lineaments: true, heatZones: false }}
              basemapStyle={settings.basemapStyle}
              coordinateFormat={settings.coordinateFormat}
              dischargeUnit={settings.dischargeUnit}
              compact={true}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] inline-block" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] inline-block" /> Moderate
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B45309] inline-block" /> Low
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#B91C1C] inline-block" /> Safety Veto
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/site-analysis')}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Analyse {selectedSiteId} →
            </button>
          </div>
        </section>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Analysed Springs &amp; Recharge Sites ({regionSites.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Heuristic AHP suitability scores paired with mandatory engineering safety gate status
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/intervention-planner')}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Open Intervention Planner →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                  <th className="py-2.5 px-3 font-semibold">Site ID &amp; Name</th>
                  <th className="py-2.5 px-3 font-semibold">Tribal Hamlet</th>
                  <th className="py-2.5 px-3 font-semibold text-right">AHP Score</th>
                  <th className="py-2.5 px-3 font-semibold">Safety &amp; Feasibility Gate</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Pre-Monsoon Flow</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {regionSites.map((site) => (
                  <tr
                    key={site.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      site.id === selectedSiteId ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-semibold text-slate-900">{site.id}</div>
                      <div className="text-slate-700 font-medium">{site.name}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div>{site.tribalHamlet}</div>
                      <div className="text-[11px] text-slate-400">
                        {site.beneficiaries.households} HH · {site.siteType}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <span className="font-bold text-slate-900">{site.suitabilityScore}</span>
                      <span className="text-slate-400">/100</span>
                      <div className="text-[11px] text-slate-500">{site.suitabilityCategory}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      {site.safetyAssessment.passed ? (
                        <div className="flex items-center gap-1.5 text-[#15803D] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Passed ({site.safetyAssessment.slopeDeg}° slope)</span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5 text-[#B91C1C]">
                          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block">VETO: Excavation Blocked</span>
                            <span className="text-[11px] text-red-700 line-clamp-1">
                              {site.safetyAssessment.vetoReason}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                      {formatDischarge(
                        site.hydrology.preMonsoonDischargeLpm,
                        settings.dischargeUnit
                      )}
                      <div className="text-[11px] text-slate-500">Risk: {site.dryingRisk}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenSiteAnalysis(site.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#2563EB] hover:bg-blue-50 rounded border border-blue-200 whitespace-nowrap"
                      >
                        Inspect Site
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded p-5">
            <h3 className="text-base font-bold text-slate-900">
              Recharge Suitability Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">
              Sites classified by AHP heuristic and mandatory safety screening
            </p>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={suitabilityDistData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={135}
                    tick={{ fontSize: 11, fill: '#334155' }}
                  />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" name="Sites" radius={[0, 3, 3, 0]}>
                    {suitabilityDistData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-base font-bold text-slate-900">
                Recent Field Verifications
              </h3>
              <button
                type="button"
                onClick={() => navigate('/field-verification')}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                + Log Observation
              </button>
            </div>

            {regionVerifications.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded">
                No field verifications logged for this region yet.
              </div>
            ) : (
              <div className="space-y-3">
                {regionVerifications.slice(0, 3).map((fv) => (
                  <div
                    key={fv.id}
                    className="p-3 rounded border border-slate-200 bg-slate-50/60 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                      <span>{fv.siteId} · {fv.observationDate}</span>
                      <span
                        className={
                          fv.verificationStatus.includes('Flagged')
                            ? 'text-[#B91C1C] font-semibold'
                            : 'text-[#15803D] font-semibold'
                        }
                      >
                        {fv.verificationStatus}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 mt-0.5">{fv.siteName}</div>
                    <div className="text-slate-600 mt-1 line-clamp-2">{fv.notes}</div>
                    <div className="mt-1.5 text-[11px] text-slate-500">
                      Observer: {fv.observerName} · Flow:{' '}
                      <span className="font-mono">
                        {formatDischarge(fv.measuredDischargeLpm, settings.dischargeUnit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
