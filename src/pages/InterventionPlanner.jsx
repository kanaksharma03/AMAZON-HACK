import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Plus,
  Trash2,
  Info,
  FileSpreadsheet,
} from 'lucide-react';
import { useBhujalStore } from '../store/useBhujalStore';
import { formatCurrencyInr } from '../utils/formatters';

function evaluateInterventionEligibility(site, intervention) {
  const slope = site.safetyAssessment.slopeDeg;
  const [minSlope, maxSlope] = intervention.applicableSlopesDeg;

  if (!site.safetyAssessment.passed && intervention.prohibitedIfSafetyVeto) {
    return {
      eligible: false,
      statusLabel: 'BLOCKED BY SAFETY VETO',
      reason: `Site has an active safety veto (${site.safetyAssessment.vetoReason}). Structural excavation or water impoundment is strictly prohibited regardless of suitability score (${site.suitabilityScore}/100).`,
    };
  }

  if (slope < minSlope || slope > maxSlope) {
    return {
      eligible: false,
      statusLabel: 'INELIGIBLE SLOPE GRADIENT',
      reason: `Site slope (${slope}°) is outside the safe engineering design window (${minSlope}°–${maxSlope}°) for ${intervention.name}.`,
    };
  }

  const isPrimaryRecommended = site.recommendedInterventions?.includes(intervention.id);
  return {
    eligible: true,
    isPrimaryRecommended,
    statusLabel: isPrimaryRecommended ? 'RECOMMENDED & ELIGIBLE' : 'ELIGIBLE ALTERNATIVE',
    reason: isPrimaryRecommended
      ? `Matches site lithology (${site.terrainAndLithology.lithology}), slope (${slope}°), and catchment geometry.`
      : `Feasible within slope (${slope}°) and safety parameters; verify local site layout before selection.`,
  };
}

export default function InterventionPlanner() {
  const navigate = useNavigate();
  const {
    regions,
    selectedRegionId,
    setSelectedRegionId,
    sites,
    selectedSiteId,
    setSelectedSiteId,
    interventionsCatalog,
    plannedInterventions,
    addPlannedIntervention,
    removePlannedIntervention,
  } = useBhujalStore();

  const site =
    sites.find((s) => s.id === selectedSiteId) ||
    sites.find((s) => s.regionId === selectedRegionId) ||
    sites[0];

  const [selectedInterventionId, setSelectedInterventionId] = useState('INT-SCT');
  const [quantityUnits, setQuantityUnits] = useState(1);
  const [engineerNotes, setEngineerNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const handleSiteChange = (newSiteId) => {
    const target = sites.find((s) => s.id === newSiteId);
    if (target && target.regionId !== selectedRegionId) {
      setSelectedRegionId(target.regionId);
    }
    setSelectedSiteId(newSiteId);
    setFeedbackMsg(null);
  };

  const evaluatedCatalog = interventionsCatalog.map((intv) => ({
    ...intv,
    evaluation: evaluateInterventionEligibility(site, intv),
  }));

  const activeIntervention =
    evaluatedCatalog.find((i) => i.id === selectedInterventionId) || evaluatedCatalog[0];

  const handleAddPlan = (e) => {
    e.preventDefault();
    if (!activeIntervention.evaluation.eligible) {
      setFeedbackMsg({
        type: 'error',
        text: `Cannot shortlist ${activeIntervention.name}: blocked by mandatory safety/slope constraint.`,
      });
      return;
    }

    const units = Math.max(1, Math.min(20, Number(quantityUnits) || 1));
    addPlannedIntervention({
      siteId: site.id,
      interventionId: activeIntervention.id,
      quantityUnits: units,
      estimatedCostInr: activeIntervention.unitCostInr * units,
      expectedRechargeM3: activeIntervention.expectedRechargeM3PerYr * units,
      engineerNotes:
        engineerNotes.trim() ||
        `Planned ${units} unit(s) of ${activeIntervention.name} for ${site.name} (${site.tribalHamlet}).`,
      status: site.safetyAssessment.requiresFieldEngineerSignoff
        ? 'Requires Geotechnical Engineer Sign-Off'
        : 'Shortlisted (Pending Field Verification)',
    });

    setEngineerNotes('');
    setFeedbackMsg({
      type: 'success',
      text: `Added ${activeIntervention.name} (${units} unit) for ${site.id} to the active Intervention Portfolio.`,
    });
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <section className="bg-white border border-slate-200 rounded p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <label
              htmlFor="planner-site-select"
              className="block text-[11px] font-semibold text-slate-500 mb-1"
            >
              Target Site for Recharge &amp; Spring Revival Planning
            </label>
            <select
              id="planner-site-select"
              value={site.id}
              onChange={(e) => handleSiteChange(e.target.value)}
              className="w-full sm:w-96 text-xs font-semibold bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2563EB]"
            >
              {regions.map((reg) => (
                <optgroup key={reg.id} label={`${reg.name} (${reg.state})`}>
                  {sites
                    .filter((s) => s.regionId === reg.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} — {s.name} (Score: {s.suitabilityScore}/100 ·{' '}
                        {s.safetyAssessment.passed ? 'Safe' : 'SAFETY VETO'})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 max-w-xl flex items-start gap-2">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <strong>Engineering &amp; Cost Disclosure:</strong> Recommendations and unit costs are
              preliminary watershed planning estimates based on illustrative MGNREGA / State
              Watershed norms. They do <strong>not</strong> constitute approved civil engineering
              designs.
            </div>
          </div>
        </div>

        <div
          className={`mt-4 p-3.5 rounded border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            site.safetyAssessment.passed
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              : 'bg-red-50 border-red-300 text-[#B91C1C]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {site.safetyAssessment.passed ? (
              <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block">
                {site.safetyAssessment.passed
                  ? `Safety Gate Passed for ${site.name} (AHP Score: ${site.suitabilityScore}/100)`
                  : `SAFETY VETO ENFORCED ON ${site.id} — Structural Excavation Locked (Despite ${site.suitabilityScore}/100 AHP Score)`}
              </span>
              <span className="block mt-0.5">
                {site.safetyAssessment.passed
                  ? `Slope: ${site.safetyAssessment.slopeDeg}° · Lithology: ${site.terrainAndLithology.lithology} · Sanitary Buffer: ${site.safetyAssessment.contaminationBufferM} m.`
                  : site.safetyAssessment.vetoReason}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/site-analysis')}
            className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded hover:bg-slate-100 whitespace-nowrap shrink-0"
          >
            Inspect Site Factors
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded p-5">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Intervention Eligibility, Safety &amp; Cost-Benefit Matrix for {site.id}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any eligible intervention row to configure and add to the watershed implementation plan
            </p>
          </div>

          <div className="space-y-3">
            {evaluatedCatalog.map((item) => {
              const isSelected = item.id === activeIntervention.id;
              const { eligible, statusLabel, reason } = item.evaluation;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedInterventionId(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedInterventionId(item.id);
                  }}
                  className={`p-4 rounded border transition-colors cursor-pointer text-xs ${
                    !eligible
                      ? 'bg-red-50/40 border-red-200 opacity-85'
                      : isSelected
                      ? 'bg-blue-50/50 border-[#2563EB] ring-1 ring-[#2563EB]'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500">{item.id}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-[11px] font-medium text-slate-600">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{item.name}</h4>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[11px] font-bold ${
                          !eligible
                            ? 'text-[#B91C1C]'
                            : item.evaluation.isPrimaryRecommended
                            ? 'text-[#15803D]'
                            : 'text-[#2563EB]'
                        }`}
                      >
                        {statusLabel}
                      </span>
                      <div className="font-mono text-slate-800 mt-0.5">
                        {formatCurrencyInr(item.unitCostInr)}{' '}
                        <span className="text-[11px] text-slate-500">/ unit</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 mt-2">{item.description}</p>

                  <div
                    className={`mt-2.5 p-2 rounded border text-[11px] ${
                      !eligible
                        ? 'bg-red-50 border-red-200 text-[#B91C1C] font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <strong>Site Evaluation ({site.id}):</strong> {reason}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block">Indicative Recharge Yield</span>
                      <span className="font-mono font-semibold text-slate-900">
                        ~{item.expectedRechargeM3PerYr.toLocaleString()} m³/yr per unit
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Safe Slope Window</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {item.applicableSlopesDeg[0]}° – {item.applicableSlopesDeg[1]}° (Site:{' '}
                        {site.safetyAssessment.slopeDeg}°)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Maintenance &amp; Labor</span>
                      <span className="text-slate-800">{item.maintenanceComplexity}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded p-5">
            <h3 className="text-base font-bold text-slate-900">
              Configure Intervention for {site.id}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selected: <strong>{activeIntervention.name}</strong>
            </p>

            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1.5">
              <div>
                <span className="text-slate-500">Unit Basis:</span>{' '}
                <span className="text-slate-800">{activeIntervention.unitBasis}</span>
              </div>
              <div>
                <span className="text-slate-500">Cost Assumption:</span>{' '}
                <span className="text-slate-700">{activeIntervention.costAssumptions}</span>
              </div>
              <div>
                <span className="text-slate-500">Heat Resilience Co-Benefit:</span>{' '}
                <span className="text-slate-700">{activeIntervention.heatResilienceBenefit}</span>
              </div>
            </div>

            {!activeIntervention.evaluation.eligible ? (
              <div className="mt-4 p-3.5 bg-red-50 border border-red-300 rounded text-xs text-[#B91C1C]">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Selection Locked by Safety / Slope Rule</span>
                </div>
                <p className="mt-1">{activeIntervention.evaluation.reason}</p>
                <p className="mt-2 text-red-800">
                  Select an eligible non-invasive alternative (such as{' '}
                  <strong>INT-SSD Spring Sanctuary Protection</strong> or{' '}
                  <strong>INT-RWH Hamlet Spring-Box</strong>) to proceed.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddPlan} className="mt-4 space-y-3 text-xs">
                <div>
                  <label
                    htmlFor="intv-units"
                    className="block font-semibold text-slate-700 mb-1"
                  >
                    Number of Units / Clusters (1–20) *
                  </label>
                  <input
                    id="intv-units"
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={quantityUnits}
                    onChange={(e) => setQuantityUnits(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-blue-50/50 border border-blue-200 rounded">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Indicative Cost</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrencyInr(
                        activeIntervention.unitCostInr * (Number(quantityUnits) || 1)
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Est. Recharge Gain</span>
                    <span className="font-mono font-bold text-[#15803D]">
                      +
                      {(
                        activeIntervention.expectedRechargeM3PerYr * (Number(quantityUnits) || 1)
                      ).toLocaleString()}{' '}
                      m³/yr
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="intv-notes"
                    className="block font-semibold text-slate-700 mb-1"
                  >
                    Field Engineering &amp; Community Implementation Notes
                  </label>
                  <textarea
                    id="intv-notes"
                    rows={3}
                    value={engineerNotes}
                    onChange={(e) => setEngineerNotes(e.target.value)}
                    placeholder="Specify contour alignment, spillway location, or Gram Sabha maintenance responsibility..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {site.safetyAssessment.requiresFieldEngineerSignoff && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                    <span>
                      <strong>Mandatory Field Verification Warning:</strong> This site requires
                      on-ground Geotechnical / Assistant Engineer sign-off prior to execution.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Shortlisted Intervention Plan</span>
                </button>
              </form>
            )}

            {feedbackMsg && (
              <div
                className={`mt-3 p-2.5 rounded border text-xs ${
                  feedbackMsg.type === 'error'
                    ? 'bg-red-50 border-red-300 text-[#B91C1C]'
                    : 'bg-emerald-50 border-emerald-300 text-[#15803D]'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-base font-bold text-slate-900">
                Shortlisted Intervention Portfolio ({plannedInterventions.length})
              </h3>
              <button
                type="button"
                onClick={() => navigate('/reports')}
                className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export in Reports</span>
              </button>
            </div>

            {plannedInterventions.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded">
                No interventions shortlisted yet. Select an eligible intervention to add it to the
                portfolio.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {plannedInterventions.map((plan) => {
                  const planSite = sites.find((s) => s.id === plan.siteId);
                  const intv = interventionsCatalog.find((i) => i.id === plan.interventionId);
                  return (
                    <div
                      key={plan.planId}
                      className="p-3 rounded border border-slate-200 bg-slate-50/70 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[11px] text-slate-500">
                            {plan.planId} · {plan.siteId} ({planSite?.tribalHamlet})
                          </span>
                          <div className="font-bold text-slate-900 mt-0.5">
                            {intv?.name || plan.interventionId} × {plan.quantityUnits}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePlannedIntervention(plan.planId)}
                          title="Remove from plan"
                          className="p-1 text-slate-400 hover:text-[#B91C1C] rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-slate-700">
                        <span>Cost: {formatCurrencyInr(plan.estimatedCostInr)}</span>
                        <span className="text-[#15803D] font-semibold">
                          +{plan.expectedRechargeM3.toLocaleString()} m³/yr
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-600">{plan.engineerNotes}</p>
                      <div className="mt-1 text-[10px] text-slate-500 font-medium">
                        Status: {plan.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
