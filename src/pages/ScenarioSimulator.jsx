import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Sliders,
  RotateCcw,
  BookmarkPlus,
  AlertTriangle,
} from 'lucide-react';
import { useBhujalStore } from '../store/useBhujalStore';
import { formatDischarge } from '../utils/formatters';

const SCENARIO_PRESETS = [
  {
    id: 'BASELINE',
    label: 'Historical Baseline (No Change)',
    monsoonRainfallChangePct: 0,
    tempAnomalyC: 0.0,
    highIntensityRainLossPct: 0,
    interventionCoveragePct: 0,
    vegetativeRestorationPct: 0,
  },
  {
    id: 'DROUGHT_HEAT',
    label: 'Severe Monsoon Deficit (-20% Rain, +2.0°C Heat)',
    monsoonRainfallChangePct: -20,
    tempAnomalyC: 2.0,
    highIntensityRainLossPct: 15,
    interventionCoveragePct: 0,
    vegetativeRestorationPct: 0,
  },
  {
    id: 'INTERVENTION_ONLY',
    label: 'Full Recharge & Sanctuary Plan (Current Climate)',
    monsoonRainfallChangePct: 0,
    tempAnomalyC: 0.5,
    highIntensityRainLossPct: 5,
    interventionCoveragePct: 85,
    vegetativeRestorationPct: 75,
  },
  {
    id: 'CLIMATE_STRESS_WITH_INTERVENTION',
    label: 'Erratic Monsoon (-12% Rain, +1.5°C) + 75% Recharge Plan',
    monsoonRainfallChangePct: -12,
    tempAnomalyC: 1.5,
    highIntensityRainLossPct: 10,
    interventionCoveragePct: 75,
    vegetativeRestorationPct: 60,
  },
];

export default function ScenarioSimulator() {
  const {
    regions,
    selectedRegionId,
    sites,
    scenarioParams,
    updateScenarioParams,
    resetScenarioParams,
    saveScenarioSnapshot,
    savedScenarioSnapshots,
    settings,
  } = useBhujalStore();

  const [snapshotSavedMsg, setSnapshotSavedMsg] = useState('');

  const activeRegion = regions.find((r) => r.id === selectedRegionId) || regions[0];
  const regionSites = sites.filter((s) => s.regionId === selectedRegionId);

  const rainFactor = 1 + scenarioParams.monsoonRainfallChangePct / 100;
  const flashLossFactor = 1 - (scenarioParams.highIntensityRainLossPct / 100) * 0.45;
  const etTempFactor = 1 + 0.045 * scenarioParams.tempAnomalyC;
  const vegEtMitigation = 1 - 0.08 * (scenarioParams.vegetativeRestorationPct / 100);
  const rechargeInterventionBoost =
    1 +
    0.38 * (scenarioParams.interventionCoveragePct / 100) +
    0.14 * (scenarioParams.vegetativeRestorationPct / 100);

  const simulatedMonthlySeries = activeRegion.monthlyClimate.map((m) => {
    const simRainfall = Math.max(0, Number((m.rainfallMm * rainFactor).toFixed(1)));
    const simEt = Number((m.etMm * etTempFactor * vegEtMitigation).toFixed(1));
    const rawRecharge = m.potentialRechargeMm * rainFactor * flashLossFactor * rechargeInterventionBoost;
    const tempEvapPenalty = Math.max(0.72, 1 - 0.035 * scenarioParams.tempAnomalyC);
    const simRecharge = Number((rawRecharge * tempEvapPenalty).toFixed(1));

    const rechargeRatio =
      m.potentialRechargeMm > 0 ? simRecharge / m.potentialRechargeMm : 1;
    const isDrySeason = ['Feb', 'Mar', 'Apr', 'May'].includes(m.month);
    const storageCarryoverBoost = isDrySeason
      ? 1 + 0.48 * (scenarioParams.interventionCoveragePct / 100)
      : 1;

    const simDischarge = Number(
      Math.max(
        0.8,
        m.baselineDischargeLpm *
          Math.pow(Math.max(0.35, rechargeRatio), 0.55) *
          storageCarryoverBoost *
          tempEvapPenalty
      ).toFixed(1)
    );

    return {
      ...m,
      simRainfallMm: simRainfall,
      simEtMm: simEt,
      simRechargeMm: simRecharge,
      simDischargeLpm: simDischarge,
    };
  });

  const baselineAnnualRain = activeRegion.monthlyClimate.reduce((a, b) => a + b.rainfallMm, 0);
  const simAnnualRain = simulatedMonthlySeries.reduce((a, b) => a + b.simRainfallMm, 0);

  const baselineAnnualRechargeMm = activeRegion.monthlyClimate.reduce(
    (a, b) => a + b.potentialRechargeMm,
    0
  );
  const simAnnualRechargeMm = simulatedMonthlySeries.reduce((a, b) => a + b.simRechargeMm, 0);

  const dryMonths = ['Mar', 'Apr', 'May'];
  const baselineDryDischarge =
    activeRegion.monthlyClimate
      .filter((m) => dryMonths.includes(m.month))
      .reduce((a, b) => a + b.baselineDischargeLpm, 0) / 3;

  const simDryDischarge =
    simulatedMonthlySeries
      .filter((m) => dryMonths.includes(m.month))
      .reduce((a, b) => a + b.simDischargeLpm, 0) / 3;

  const dischargeDeltaPct =
    baselineDryDischarge > 0
      ? (((simDryDischarge - baselineDryDischarge) / baselineDryDischarge) * 100).toFixed(1)
      : '0.0';

  const handleApplyPreset = (preset) => {
    updateScenarioParams({
      presetId: preset.id,
      monsoonRainfallChangePct: preset.monsoonRainfallChangePct,
      tempAnomalyC: preset.tempAnomalyC,
      highIntensityRainLossPct: preset.highIntensityRainLossPct,
      interventionCoveragePct: preset.interventionCoveragePct,
      vegetativeRestorationPct: preset.vegetativeRestorationPct,
    });
  };

  const handleSaveSnapshot = () => {
    saveScenarioSnapshot({
      regionId: activeRegion.id,
      regionName: activeRegion.name,
      params: { ...scenarioParams },
      baselineAnnualRechargeMm: Number(baselineAnnualRechargeMm.toFixed(1)),
      simAnnualRechargeMm: Number(simAnnualRechargeMm.toFixed(1)),
      baselineDryDischargeLpm: Number(baselineDryDischarge.toFixed(1)),
      simDryDischargeLpm: Number(simDryDischarge.toFixed(1)),
      dischargeDeltaPct,
    });
    setSnapshotSavedMsg('Scenario snapshot saved to Reports module.');
    setTimeout(() => setSnapshotSavedMsg(''), 3500);
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <section className="bg-amber-50 border border-amber-300 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-xs text-amber-950">
          <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              SIMULATED / ILLUSTRATIVE SCENARIO OUTPUTS — Not Validated Predictive Groundwater Heads
            </span>
            <span className="text-amber-900">
              This module applies a conceptual monthly water-balance and exponential spring recession
              heuristic to compare relative sensitivity across rainfall anomalies, thermal stress, and
              watershed recharge interventions for <strong>{activeRegion.name}</strong>.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetScenarioParams}
            className="px-3 py-1.5 text-xs font-medium bg-white border border-amber-300 text-amber-900 rounded hover:bg-amber-100 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSnapshot}
            className="px-3 py-1.5 text-xs font-semibold bg-[#2563EB] text-white rounded hover:bg-[#1D4ED8] flex items-center gap-1.5"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Snapshot to Report</span>
          </button>
        </div>
      </section>

      {snapshotSavedMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-[#15803D] px-4 py-2 rounded text-xs font-semibold">
          {snapshotSavedMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded p-5 space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Scenario Assumptions &amp; Controls
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a preset or adjust hydro-climatic &amp; management sliders
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500">Scenario Presets</div>
            {SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`w-full text-left px-3 py-2 rounded border text-xs font-medium transition-colors ${
                  scenarioParams.presetId === preset.id
                    ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] font-semibold'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-4 pt-3 border-t border-slate-200 text-xs">
            <div>
              <div className="flex justify-between font-medium text-slate-800 mb-1">
                <label htmlFor="slider-rain">Monsoon Rainfall Shift</label>
                <span className="font-mono font-bold text-[#2563EB]">
                  {scenarioParams.monsoonRainfallChangePct > 0 ? '+' : ''}
                  {scenarioParams.monsoonRainfallChangePct}%
                </span>
              </div>
              <input
                id="slider-rain"
                type="range"
                min={-35}
                max={25}
                step={1}
                value={scenarioParams.monsoonRainfallChangePct}
                onChange={(e) =>
                  updateScenarioParams({
                    presetId: 'CUSTOM',
                    monsoonRainfallChangePct: Number(e.target.value),
                  })
                }
                className="w-full accent-[#2563EB]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>-35% (Severe Drought)</span>
                <span>0%</span>
                <span>+25% (Wet)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-800 mb-1">
                <label htmlFor="slider-temp">Pre-Monsoon Heat Anomaly (ΔT)</label>
                <span className="font-mono font-bold text-[#B45309]">
                  +{scenarioParams.tempAnomalyC.toFixed(1)}°C
                </span>
              </div>
              <input
                id="slider-temp"
                type="range"
                min={0}
                max={3.0}
                step={0.1}
                value={scenarioParams.tempAnomalyC}
                onChange={(e) =>
                  updateScenarioParams({
                    presetId: 'CUSTOM',
                    tempAnomalyC: Number(e.target.value),
                  })
                }
                className="w-full accent-[#B45309]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>+0.0°C</span>
                <span>+1.5°C</span>
                <span>+3.0°C (Extreme Heat)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-800 mb-1">
                <label htmlFor="slider-intensity">High-Intensity Cloudburst Runoff Loss</label>
                <span className="font-mono font-bold text-slate-800">
                  {scenarioParams.highIntensityRainLossPct}%
                </span>
              </div>
              <input
                id="slider-intensity"
                type="range"
                min={0}
                max={35}
                step={1}
                value={scenarioParams.highIntensityRainLossPct}
                onChange={(e) =>
                  updateScenarioParams({
                    presetId: 'CUSTOM',
                    highIntensityRainLossPct: Number(e.target.value),
                  })
                }
                className="w-full accent-slate-700"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-800 mb-1">
                <label htmlFor="slider-intv">Eligible Recharge Structure Coverage</label>
                <span className="font-mono font-bold text-[#15803D]">
                  {scenarioParams.interventionCoveragePct}%
                </span>
              </div>
              <input
                id="slider-intv"
                type="range"
                min={0}
                max={100}
                step={5}
                value={scenarioParams.interventionCoveragePct}
                onChange={(e) =>
                  updateScenarioParams({
                    presetId: 'CUSTOM',
                    interventionCoveragePct: Number(e.target.value),
                  })
                }
                className="w-full accent-[#15803D]"
              />
              <div className="text-[11px] text-slate-500 mt-0.5">
                Applies only to sites passing the mandatory Safety Gate ({regionSites.filter((s) => s.safetyAssessment.passed).length}/{regionSites.length} sites).
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-800 mb-1">
                <label htmlFor="slider-veg">Vegetative Canopy &amp; Mulch Restoration</label>
                <span className="font-mono font-bold text-[#15803D]">
                  {scenarioParams.vegetativeRestorationPct}%
                </span>
              </div>
              <input
                id="slider-veg"
                type="range"
                min={0}
                max={100}
                step={5}
                value={scenarioParams.vegetativeRestorationPct}
                onChange={(e) =>
                  updateScenarioParams({
                    presetId: 'CUSTOM',
                    vegetativeRestorationPct: Number(e.target.value),
                  })
                }
                className="w-full accent-[#15803D]"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 leading-relaxed">
            <strong>Assumptions &amp; Limitations:</strong> Assumes linear recharge scaling within
            available vadose regolith thickness and excludes multi-year deep regional aquifer
            drawdown from mechanized borewells.
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded p-4">
              <div className="text-xs text-slate-500 font-medium">
                Annual Effective Recharge (Simulated)
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                  {simAnnualRechargeMm.toFixed(1)} mm
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Base: {baselineAnnualRechargeMm.toFixed(1)} mm
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-600">
                Simulated Rain: <span className="font-mono">{simAnnualRain.toFixed(0)} mm</span> vs{' '}
                <span className="font-mono">{baselineAnnualRain} mm</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-4">
              <div className="text-xs text-slate-500 font-medium">
                Dry-Season Mean Spring Flow (Mar–May)
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono tabular-nums text-[#2563EB]">
                  {formatDischarge(simDryDischarge, settings.dischargeUnit)}
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    Number(dischargeDeltaPct) >= 0 ? 'text-[#15803D]' : 'text-[#B91C1C]'
                  }`}
                >
                  {Number(dischargeDeltaPct) >= 0 ? '+' : ''}
                  {dischargeDeltaPct}%
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-600">
                Baseline Mar–May Mean:{' '}
                <span className="font-mono">
                  {formatDischarge(baselineDryDischarge, settings.dischargeUnit)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-4">
              <div className="text-xs text-slate-500 font-medium">
                Summer Tribal Water Security Impact
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                  {simDryDischarge >= 10
                    ? 'Sustained'
                    : simDryDischarge >= 6
                    ? 'Moderate Stress'
                    : 'Acute Deficit'}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-600">
                Illustrative threshold: ≥10 LPM required per 50-HH hamlet
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Baseline vs. Simulated Spring Discharge Hydrograph (Jan–Dec)
                </h3>
                <p className="text-xs text-slate-500">
                  Illustrative monthly discharge response (LPM) under selected climate &amp; intervention parameters
                </p>
              </div>
              <span className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Simulated Heuristic Output
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={simulatedMonthlySeries}
                  margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    label={{
                      value: 'Discharge (LPM)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 11, fill: '#64748B' },
                    }}
                  />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="baselineDischargeLpm"
                    name="Baseline Discharge (LPM)"
                    stroke="#64748B"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="simDischargeLpm"
                    name="Simulated Scenario Discharge (LPM)"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ r: 3.5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Monthly Scenario Comparison Table (Baseline vs. Simulated)
            </h3>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 px-2.5 font-semibold">Month</th>
                    <th className="py-2 px-2.5 font-semibold text-right">Base Rain (mm)</th>
                    <th className="py-2 px-2.5 font-semibold text-right">Sim Rain (mm)</th>
                    <th className="py-2 px-2.5 font-semibold text-right">Base Recharge (mm)</th>
                    <th className="py-2 px-2.5 font-semibold text-right">Sim Recharge (mm)</th>
                    <th className="py-2 px-2.5 font-semibold text-right">Base Flow (LPM)</th>
                    <th className="py-2 px-2.5 font-semibold text-right">Sim Flow (LPM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                  {simulatedMonthlySeries.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-sans font-semibold text-slate-900">
                        {row.month}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-slate-600">{row.rainfallMm}</td>
                      <td className="py-1.5 px-2.5 text-right text-slate-900">{row.simRainfallMm}</td>
                      <td className="py-1.5 px-2.5 text-right text-slate-600">
                        {row.potentialRechargeMm}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-[#15803D] font-semibold">
                        {row.simRechargeMm}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-slate-600">
                        {row.baselineDischargeLpm}
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-[#2563EB] font-bold">
                        {row.simDischargeLpm}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
