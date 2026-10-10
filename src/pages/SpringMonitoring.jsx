import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Search,
  AlertTriangle,
  ClipboardCheck,
  Microscope,
} from 'lucide-react';
import { useBhujalStore } from '../store/useBhujalStore';
import { formatCoordinates, formatDischarge } from '../utils/formatters';

export default function SpringMonitoring() {
  const navigate = useNavigate();
  const {
    regions,
    selectedRegionId,
    sites,
    selectedSiteId,
    setSelectedSiteId,
    settings,
  } = useBhujalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [regionScope, setRegionScope] = useState(selectedRegionId);

  const scopedSites = sites.filter((s) => {
    if (regionScope !== 'ALL_REGIONS' && s.regionId !== regionScope) return false;
    if (riskFilter !== 'ALL' && s.dryingRisk !== riskFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.tribalHamlet.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeSpring =
    scopedSites.find((s) => s.id === selectedSiteId) || scopedSites[0] || sites[0];

  const observations = activeSpring?.hydrology?.historicalObservations || [];

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <section className="bg-white border border-slate-200 rounded p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="mon-region" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Watershed Study Scope
            </label>
            <select
              id="mon-region"
              value={regionScope}
              onChange={(e) => setRegionScope(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
            >
              <option value="ALL_REGIONS">All Study Watersheds ({sites.length} Springs)</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.state})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mon-search" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Search Spring ID, Name or Hamlet
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
              <input
                id="mon-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search springs..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded"
              />
            </div>
          </div>

          <div>
            <label htmlFor="mon-risk" className="block text-[11px] font-semibold text-slate-500 mb-1">
              Filter by Drying Risk
            </label>
            <select
              id="mon-risk"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900"
            >
              <option value="ALL">All Drying Risk Levels</option>
              <option value="Critical">Critical Drying Risk</option>
              <option value="High">High Drying Risk</option>
              <option value="Moderate">Moderate Risk</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => navigate('/field-verification')}
              className="w-full py-1.5 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Add New Field Observation</span>
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Spring Monitoring Inventory ({scopedSites.length})
            </h3>
            <span className="text-[11px] text-slate-500">Click row to inspect records</span>
          </div>

          {scopedSites.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded">
              No springs match the selected search or risk filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border-t border-b border-slate-200 overflow-y-auto max-h-[540px]">
              {scopedSites.map((s) => {
                const isSelected = s.id === activeSpring?.id;
                const obsCount = s.hydrology.historicalObservations.length;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSiteId(s.id)}
                    className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1 ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900">
                        {s.id} · {s.siteType}
                      </span>
                      <span
                        className={`font-semibold text-[11px] ${
                          s.dryingRisk === 'Critical'
                            ? 'text-[#B91C1C]'
                            : s.dryingRisk === 'High'
                            ? 'text-[#B45309]'
                            : 'text-[#15803D]'
                        }`}
                      >
                        {s.dryingRisk} Drying Risk
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-600">
                      Hamlet: {s.tribalHamlet} · Status: <strong>{s.springStatus}</strong>
                    </div>

                    <div className="mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>
                        Pre-Monsoon:{' '}
                        <strong className="text-slate-800">
                          {formatDischarge(
                            s.hydrology.preMonsoonDischargeLpm,
                            settings.dischargeUnit
                          )}
                        </strong>
                      </span>
                      <span>
                        {obsCount > 0 ? `${obsCount} obs recorded` : 'No Historical Data'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {activeSpring && (
          <section className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    {activeSpring.id} · Watershed {activeSpring.watershedCode} ·{' '}
                    {formatCoordinates(
                      activeSpring.coordinates.lat,
                      activeSpring.coordinates.lon,
                      settings.coordinateFormat
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">{activeSpring.name}</h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hamlet: <strong>{activeSpring.tribalHamlet}</strong> ({activeSpring.beneficiaries.households} HH ·{' '}
                    {activeSpring.beneficiaries.tribalCommunity})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/site-analysis')}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded flex items-center gap-1"
                  >
                    <Microscope className="w-3.5 h-3.5" />
                    <span>Site Analysis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/field-verification')}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded"
                  >
                    + Log Measurement
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[11px]">Pre-Monsoon Flow</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {formatDischarge(
                      activeSpring.hydrology.preMonsoonDischargeLpm,
                      settings.dischargeUnit
                    )}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[11px]">Post-Monsoon Flow</span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {formatDischarge(
                      activeSpring.hydrology.postMonsoonDischargeLpm,
                      settings.dischargeUnit
                    )}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[11px]">Discharge Decay</span>
                  <span className="font-mono font-bold text-sm text-[#B91C1C]">
                    {activeSpring.hydrology.dischargeDecayRatePct}%
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[11px]">Last Verified</span>
                  <span className="font-mono font-semibold text-sm text-slate-900">
                    {activeSpring.lastVerifiedDate || 'Never'}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Recorded Discharge Observation Timeline ({observations.length} Records)
                </h3>

                {observations.length === 0 ? (
                  <div className="p-6 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-950">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-sm">
                          No Historical Field Measurements Available for {activeSpring.id}
                        </span>
                        <p className="mt-1 text-amber-900">
                          Per scientific integrity rules, BHUJAL does not fabricate or interpolate
                          synthetic historical hydrographs for unmonitored springs. Use the Field
                          Verification module to record the first volumetric bucket-and-stopwatch
                          discharge measurement.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/field-verification')}
                          className="mt-3 px-3 py-1.5 bg-[#B45309] text-white font-semibold rounded hover:bg-amber-800"
                        >
                          Record First Baseline Observation →
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-56 w-full border border-slate-200 rounded p-3 bg-slate-50/40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={observations}
                        margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          label={{
                            value: 'Measured Flow (LPM)',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fontSize: 11, fill: '#64748B' },
                          }}
                        />
                        <Tooltip contentStyle={{ fontSize: '12px' }} />
                        <Line
                          type="monotone"
                          dataKey="dischargeLpm"
                          name="Measured Discharge (LPM)"
                          stroke="#2563EB"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#2563EB' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Observation Log &amp; Data Provenance
              </h3>
              {observations.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  Zero observation entries in log.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                        <th className="py-2 px-3 font-semibold">Date</th>
                        <th className="py-2 px-3 font-semibold">Season</th>
                        <th className="py-2 px-3 font-semibold text-right">Discharge</th>
                        <th className="py-2 px-3 font-semibold">Observed Condition</th>
                        <th className="py-2 px-3 font-semibold">Observer</th>
                        <th className="py-2 px-3 font-semibold">Provenance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {observations.map((obs, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-900">{obs.date}</td>
                          <td className="py-2 px-3 text-slate-700">{obs.season}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatDischarge(obs.dischargeLpm, settings.dischargeUnit)}
                          </td>
                          <td className="py-2 px-3 text-slate-800">{obs.condition}</td>
                          <td className="py-2 px-3 text-slate-600">{obs.observer}</td>
                          <td className="py-2 px-3 text-[11px] text-slate-500">{obs.provenance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
