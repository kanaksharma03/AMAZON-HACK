import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
} from 'lucide-react';
import { useBhujalStore } from '../store/useBhujalStore';
import { formatCurrencyInr, formatDischarge, formatCoordinates } from '../utils/formatters';

function triggerDownload(filename, content, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const {
    regions,
    selectedRegionId,
    sites,
    plannedInterventions,
    interventionsCatalog,
    fieldVerifications,
    savedScenarioSnapshots,
    scenarioParams,
    dataMode,
    settings,
  } = useBhujalStore();

  const [scopeRegionId, setScopeRegionId] = useState(selectedRegionId);
  const [sections, setSections] = useState({
    studyOverview: true,
    siteMatrix: true,
    interventions: true,
    scenarios: true,
    fieldVerifications: true,
    limitations: true,
  });

  const activeRegion =
    regions.find((r) => r.id === scopeRegionId) ||
    regions.find((r) => r.id === selectedRegionId) ||
    regions[0];

  const reportSites =
    scopeRegionId === 'ALL'
      ? sites
      : sites.filter((s) => s.regionId === scopeRegionId);

  const reportPlans = plannedInterventions.filter((p) =>
    reportSites.some((s) => s.id === p.siteId)
  );

  const reportVerifications =
    scopeRegionId === 'ALL'
      ? fieldVerifications
      : fieldVerifications.filter((fv) => fv.regionId === scopeRegionId);

  const handleExportSitesCsv = () => {
    const headers = [
      'Site_ID',
      'Region_ID',
      'Site_Name',
      'Tribal_Hamlet',
      'Gram_Panchayat',
      'Watershed_Code',
      'Site_Type',
      'Latitude_WGS84',
      'Longitude_WGS84',
      'Elevation_m',
      'Heuristic_AHP_Score',
      'Suitability_Category',
      'Safety_Gate_Passed',
      'Safety_Veto_Reason',
      'Slope_Deg',
      'PreMonsoon_Discharge_LPM',
      'PostMonsoon_Discharge_LPM',
      'Drying_Risk',
      'Households_Served',
      'Data_Mode',
    ];

    const rows = reportSites.map((s) => [
      s.id,
      s.regionId,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.tribalHamlet.replace(/"/g, '""')}"`,
      `"${s.gramPanchayat.replace(/"/g, '""')}"`,
      s.watershedCode,
      `"${s.siteType}"`,
      s.coordinates.lat,
      s.coordinates.lon,
      s.elevationM,
      s.suitabilityScore,
      `"${s.suitabilityCategory}"`,
      s.safetyAssessment.passed ? 'PASSED' : 'VETOED',
      `"${(s.safetyAssessment.vetoReason || 'None').replace(/"/g, '""')}"`,
      s.safetyAssessment.slopeDeg,
      s.hydrology.preMonsoonDischargeLpm ?? 'Unmeasured',
      s.hydrology.postMonsoonDischargeLpm ?? 'Unmeasured',
      s.dryingRisk,
      s.beneficiaries.households,
      dataMode.toUpperCase(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    triggerDownload(`BHUJAL_Site_Analysis_${scopeRegionId}_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const handleExportInterventionsCsv = () => {
    const headers = [
      'Plan_ID',
      'Site_ID',
      'Intervention_Code',
      'Intervention_Name',
      'Units',
      'Indicative_Cost_INR',
      'Expected_Recharge_m3_yr',
      'Approval_Status',
      'Engineer_Notes',
    ];

    const rows = reportPlans.map((p) => {
      const intv = interventionsCatalog.find((i) => i.id === p.interventionId);
      return [
        p.planId,
        p.siteId,
        p.interventionId,
        `"${(intv?.name || p.interventionId).replace(/"/g, '""')}"`,
        p.quantityUnits,
        p.estimatedCostInr,
        p.expectedRechargeM3,
        `"${p.status}"`,
        `"${(p.engineerNotes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    triggerDownload(
      `BHUJAL_Intervention_Plan_${scopeRegionId}_${new Date().toISOString().slice(0, 10)}.csv`,
      csv
    );
  };

  const handleExportJson = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      platform: 'BHUJAL — Hydro-Climatic Decision Support System (SIH 26240)',
      dataMode,
      scientificDisclaimer:
        'Suitability scores are derived via Prototype Multi-Criteria AHP Heuristic. Scenario outputs are illustrative water-balance calculations. Safety vetoes strictly override numerical scores.',
      regionScope: scopeRegionId,
      sites: reportSites,
      plannedInterventions: reportPlans,
      fieldVerifications: reportVerifications,
      activeScenarioAssumptions: scenarioParams,
      savedScenarioSnapshots,
    };
    triggerDownload(
      `BHUJAL_Technical_Report_${scopeRegionId}_${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
      'application/json'
    );
  };

  const totalCostInr = reportPlans.reduce((acc, p) => acc + p.estimatedCostInr, 0);
  const totalRechargeM3 = reportPlans.reduce((acc, p) => acc + p.expectedRechargeM3, 0);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <section className="bg-white border border-slate-200 rounded p-5 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Technical Report Builder &amp; Data Exports
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate print-ready watershed decision reports or export current platform records as CSV / JSON
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportSitesCsv}
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sites CSV ({reportSites.length})</span>
            </button>
            <button
              type="button"
              onClick={handleExportInterventionsCsv}
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Interventions CSV ({reportPlans.length})</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full JSON</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <label htmlFor="rep-scope" className="font-semibold text-slate-700">
              Watershed Scope:
            </label>
            <select
              id="rep-scope"
              value={scopeRegionId}
              onChange={(e) => setScopeRegionId(e.target.value)}
              className="px-2.5 py-1 border border-slate-300 rounded bg-white text-slate-900 font-medium"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.state})
                </option>
              ))}
              <option value="ALL">All 3 Study Watersheds Combined</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-700">
            <span className="font-semibold">Include Report Sections:</span>
            {[
              ['studyOverview', '1. Study Summary'],
              ['siteMatrix', '2. Site & Safety Matrix'],
              ['interventions', '3. Intervention Portfolio'],
              ['scenarios', '4. Scenario Comparison'],
              ['fieldVerifications', '5. Field Verification Log'],
              ['limitations', '6. Data Quality & Limitations'],
            ].map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sections[key]}
                  onChange={() =>
                    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                  className="rounded border-slate-300 text-[#2563EB]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <article className="bg-white border border-slate-300 rounded p-6 sm:p-8 space-y-6 print-container">
        <header className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500">
              BHUJAL DECISION SUPPORT SYSTEM · SIH PROBLEM STATEMENT 26240
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Spring Revival &amp; Groundwater Recharge Planning Dossier
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Scope:{' '}
              <strong>
                {scopeRegionId === 'ALL'
                  ? 'All Tribal Watershed Study Regions (Odisha, MP, Maharashtra)'
                  : `${activeRegion.name}, ${activeRegion.state}`}
              </strong>
            </p>
          </div>
          <div className="text-xs font-mono text-slate-600 sm:text-right">
            <div>Generated: {new Date().toISOString().slice(0, 10)}</div>
            <div>Data Mode: {dataMode === 'demo' ? 'Curated Demonstration Dataset' : 'Live API'}</div>
            <div>CRS: WGS84 (EPSG:4326)</div>
          </div>
        </header>

        {sections.studyOverview && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
              01. Study-Area Hydro-Climatic Overview
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              {activeRegion.summaryDescription}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-slate-500 block text-[11px]">Analysed Sites</span>
                <span className="font-mono font-bold text-slate-900">{reportSites.length}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-slate-500 block text-[11px]">Annual Rainfall Normal</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeRegion.annualRainfallMm} mm
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-slate-500 block text-[11px]">Pre-Monsoon LST Anomaly</span>
                <span className="font-mono font-bold text-[#B45309]">
                  +{activeRegion.meanLstAnomalyC}°C
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <span className="text-slate-500 block text-[11px]">Safety-Restricted Sites</span>
                <span className="font-mono font-bold text-[#B91C1C]">
                  {reportSites.filter((s) => !s.safetyAssessment.passed).length} Vetoed
                </span>
              </div>
            </div>
          </section>
        )}

        {sections.siteMatrix && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
              02. Site Suitability &amp; Mandatory Safety Assessment Matrix
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50 text-slate-600">
                    <th className="py-2 px-2 font-semibold">Site ID</th>
                    <th className="py-2 px-2 font-semibold">Spring / Recharge Site</th>
                    <th className="py-2 px-2 font-semibold">Coordinates (WGS84)</th>
                    <th className="py-2 px-2 font-semibold text-right">AHP Score</th>
                    <th className="py-2 px-2 font-semibold">Safety Gate Status</th>
                    <th className="py-2 px-2 font-semibold text-right">Pre-Monsoon</th>
                    <th className="py-2 px-2 font-semibold text-right">HH Served</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportSites.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 px-2 font-mono font-semibold text-slate-900">{s.id}</td>
                      <td className="py-2 px-2">
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {s.tribalHamlet} · {s.siteType}
                        </div>
                      </td>
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-600">
                        {formatCoordinates(
                          s.coordinates.lat,
                          s.coordinates.lon,
                          settings.coordinateFormat
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold">
                        {s.suitabilityScore}/100 ({s.suitabilityCategory})
                      </td>
                      <td className="py-2 px-2">
                        {s.safetyAssessment.passed ? (
                          <span className="text-[#15803D] font-semibold">
                            Passed ({s.safetyAssessment.slopeDeg}°)
                          </span>
                        ) : (
                          <span className="text-[#B91C1C] font-bold">
                            VETO: {s.safetyAssessment.vetoReason}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        {formatDischarge(
                          s.hydrology.preMonsoonDischargeLpm,
                          settings.dischargeUnit
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        {s.beneficiaries.households}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {sections.interventions && (
          <section className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <h2 className="text-sm font-bold text-slate-900">
                03. Shortlisted Intervention Plan &amp; Indicative Cost Estimates
              </h2>
              <span className="text-xs font-mono text-slate-700">
                Total Portfolio: {formatCurrencyInr(totalCostInr)} · +{totalRechargeM3.toLocaleString()} m³/yr
              </span>
            </div>

            {reportPlans.length === 0 ? (
              <p className="text-xs text-slate-500">
                No interventions currently shortlisted for this study scope.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50 text-slate-600">
                      <th className="py-2 px-2 font-semibold">Plan ID</th>
                      <th className="py-2 px-2 font-semibold">Target Site</th>
                      <th className="py-2 px-2 font-semibold">Intervention Type</th>
                      <th className="py-2 px-2 font-semibold text-right">Units</th>
                      <th className="py-2 px-2 font-semibold text-right">Indicative Cost</th>
                      <th className="py-2 px-2 font-semibold text-right">Est. Recharge</th>
                      <th className="py-2 px-2 font-semibold">Engineering Notes &amp; Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reportPlans.map((p) => {
                      const intv = interventionsCatalog.find((i) => i.id === p.interventionId);
                      return (
                        <tr key={p.planId}>
                          <td className="py-2 px-2 font-mono">{p.planId}</td>
                          <td className="py-2 px-2 font-mono font-semibold">{p.siteId}</td>
                          <td className="py-2 px-2 font-medium text-slate-900">
                            {intv?.name || p.interventionId}
                          </td>
                          <td className="py-2 px-2 text-right font-mono">{p.quantityUnits}</td>
                          <td className="py-2 px-2 text-right font-mono">
                            {formatCurrencyInr(p.estimatedCostInr)}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-[#15803D] font-semibold">
                            +{p.expectedRechargeM3.toLocaleString()} m³
                          </td>
                          <td className="py-2 px-2 text-[11px] text-slate-600">
                            <strong>{p.status}:</strong> {p.engineerNotes}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {sections.scenarios && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
              04. Hydro-Climatic Scenario Simulation Summary (Illustrative Heuristic)
            </h2>
            <p className="text-xs text-slate-600">
              Active Simulator Configuration: Monsoon Rainfall Shift{' '}
              <strong className="font-mono">{scenarioParams.monsoonRainfallChangePct}%</strong>,
              Temperature Anomaly{' '}
              <strong className="font-mono">+{scenarioParams.tempAnomalyC}°C</strong>, Recharge
              Structure Coverage{' '}
              <strong className="font-mono">{scenarioParams.interventionCoveragePct}%</strong>,
              Vegetative Restoration{' '}
              <strong className="font-mono">{scenarioParams.vegetativeRestorationPct}%</strong>.
            </p>
            {savedScenarioSnapshots.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="text-xs font-semibold text-slate-700">
                  Saved Scenario Snapshots ({savedScenarioSnapshots.length}):
                </div>
                {savedScenarioSnapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex flex-wrap items-center justify-between gap-2 font-mono"
                  >
                    <span>
                      {snap.id} ({snap.regionName}) · Rain {snap.params.monsoonRainfallChangePct}% ·
                      +{snap.params.tempAnomalyC}°C · Intv {snap.params.interventionCoveragePct}%
                    </span>
                    <span>
                      Dry-Season Flow: {snap.baselineDryDischargeLpm} →{' '}
                      <strong>{snap.simDryDischargeLpm} LPM</strong> ({snap.dischargeDeltaPct}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {sections.fieldVerifications && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
              05. Field Verification &amp; Safety Audit Log ({reportVerifications.length} Records)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50 text-slate-600">
                    <th className="py-2 px-2 font-semibold">Record ID</th>
                    <th className="py-2 px-2 font-semibold">Date</th>
                    <th className="py-2 px-2 font-semibold">Site ID</th>
                    <th className="py-2 px-2 font-semibold">Observer</th>
                    <th className="py-2 px-2 font-semibold">Condition &amp; Flow</th>
                    <th className="py-2 px-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportVerifications.map((fv) => (
                    <tr key={fv.id}>
                      <td className="py-2 px-2 font-mono">{fv.id}</td>
                      <td className="py-2 px-2 font-mono">{fv.observationDate}</td>
                      <td className="py-2 px-2 font-mono font-semibold">{fv.siteId}</td>
                      <td className="py-2 px-2">
                        {fv.observerName} ({fv.teamId})
                      </td>
                      <td className="py-2 px-2 font-mono">
                        {fv.observedCondition} ·{' '}
                        {formatDischarge(fv.measuredDischargeLpm, settings.dischargeUnit)}
                      </td>
                      <td className="py-2 px-2 font-semibold">{fv.verificationStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {sections.limitations && (
          <section className="p-4 bg-slate-50 border border-slate-300 rounded space-y-2 text-xs text-slate-700">
            <h2 className="text-sm font-bold text-slate-900">
              06. Mandatory Data Quality, Provenance &amp; Scientific Limitations Statement
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Heuristic Suitability Model:</strong> Recharge suitability scores are
                generated via a Multi-Criteria Analytic Hierarchy Process (AHP) weighted heuristic,
                not a trained or field-validated machine learning model.
              </li>
              <li>
                <strong>Mandatory Safety Veto Supremacy:</strong> Sites flagged with slope &gt; 35°,
                high landslide susceptibility, or upslope contamination buffers &lt; 50 m (e.g.,
                BHJ-KRP-002, BHJ-DND-002) are locked against structural excavation regardless of raw
                suitability scores.
              </li>
              <li>
                <strong>Missing Baseline Data Disclosure:</strong> Site BHJ-KRP-005 currently lacks
                pre-monsoon discharge and water quality measurements; field verification is
                mandatory prior to intervention design.
              </li>
              <li>
                <strong>Engineering Sign-Off:</strong> Indicative cost and recharge figures are for
                watershed-level prioritization only and require site-specific geotechnical and civil
                engineering approval.
              </li>
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
