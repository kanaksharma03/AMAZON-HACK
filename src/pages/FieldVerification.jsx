import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { useBhujalStore } from '../store/useBhujalStore';
import { formatDischarge } from '../utils/formatters';

export default function FieldVerification() {
  const {
    sites,
    selectedSiteId,
    selectedRegionId,
    dataMode,
    liveApiStatus,
    fieldVerifications,
    addFieldVerification,
    updateFieldVerificationStatus,
    deleteFieldVerification,
    settings,
  } = useBhujalStore();

  const activeSite =
    sites.find((s) => s.id === selectedSiteId) ||
    sites.find((s) => s.regionId === selectedRegionId) ||
    sites[0];

  const [formData, setFormData] = useState({
    siteId: activeSite.id,
    observationDate: new Date().toISOString().slice(0, 10),
    observerName: '',
    teamId: 'Block Watershed Technical Cell',
    observedCondition: 'Flowing - Normal',
    measuredDischargeLpm: '',
    measurementMethod: 'Volumetric Bucket & Stopwatch (3-trial mean)',
    ph: '',
    tdsMgL: '',
    ecUsCm: '',
    lat: String(activeSite.coordinates.lat),
    lon: String(activeSite.coordinates.lon),
    slopeHazardFlag: false,
    contaminationFlag: false,
    photoEvidenceName: '',
    notes: '',
    verificationStatus: 'Draft',
  });

  const [errors, setErrors] = useState({});
  const [submitBanner, setSubmitBanner] = useState(null);

  useEffect(() => {
    const s = sites.find((item) => item.id === formData.siteId);
    if (s) {
      setFormData((prev) => ({
        ...prev,
        lat: String(s.coordinates.lat),
        lon: String(s.coordinates.lon),
      }));
    }
  }, [formData.siteId, sites]);

  const validateForm = () => {
    const errs = {};
    if (!formData.siteId) errs.siteId = 'Site selection is required.';
    if (!formData.observationDate) errs.observationDate = 'Observation date is required.';
    if (!formData.observerName.trim()) {
      errs.observerName = 'Observer name is required for audit trail.';
    }
    if (!formData.notes.trim() || formData.notes.trim().length < 10) {
      errs.notes = 'Please provide at least 10 characters of field observation notes.';
    }

    const latNum = Number(formData.lat);
    const lonNum = Number(formData.lon);
    if (Number.isNaN(latNum) || latNum < 6 || latNum > 38) {
      errs.lat = 'Latitude must be valid WGS84 decimal degrees within India (6.0° to 38.0° N).';
    }
    if (Number.isNaN(lonNum) || lonNum < 68 || lonNum > 98) {
      errs.lon = 'Longitude must be valid WGS84 decimal degrees within India (68.0° to 98.0° E).';
    }

    if (formData.measuredDischargeLpm !== '') {
      const flow = Number(formData.measuredDischargeLpm);
      if (Number.isNaN(flow) || flow < 0 || flow > 2500) {
        errs.measuredDischargeLpm = 'Discharge must be between 0 and 2,500 LPM.';
      }
    }

    if (formData.ph !== '') {
      const phVal = Number(formData.ph);
      if (Number.isNaN(phVal) || phVal < 3 || phVal > 11) {
        errs.ph = 'pH must be between 3.0 and 11.0.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitBanner(null);

    if (dataMode === 'live' && !liveApiStatus.ok) {
      setSubmitBanner({
        type: 'error',
        text: 'Submission blocked: Platform is in Live API Mode, but no live backend server is reachable. Switch to Demo Dataset mode to save to the local demonstration store.',
      });
      return;
    }

    if (!validateForm()) return;

    const targetSite = sites.find((s) => s.id === formData.siteId);
    const finalStatus =
      formData.slopeHazardFlag || formData.contaminationFlag
        ? 'Flagged - Safety Issue'
        : formData.verificationStatus;

    addFieldVerification({
      siteId: formData.siteId,
      siteName: targetSite ? targetSite.name : formData.siteId,
      regionId: targetSite ? targetSite.regionId : selectedRegionId,
      observationDate: formData.observationDate,
      observerName: formData.observerName.trim(),
      teamId: formData.teamId.trim(),
      observedCondition: formData.observedCondition,
      measuredDischargeLpm:
        formData.measuredDischargeLpm !== '' ? Number(formData.measuredDischargeLpm) : null,
      measurementMethod: formData.measurementMethod,
      ph: formData.ph !== '' ? Number(formData.ph) : null,
      tdsMgL: formData.tdsMgL !== '' ? Number(formData.tdsMgL) : null,
      ecUsCm: formData.ecUsCm !== '' ? Number(formData.ecUsCm) : null,
      coordinates: {
        lat: Number(formData.lat),
        lon: Number(formData.lon),
      },
      slopeHazardFlag: formData.slopeHazardFlag,
      contaminationFlag: formData.contaminationFlag,
      photoEvidenceName: formData.photoEvidenceName || 'No photo attached',
      notes: formData.notes.trim(),
      verificationStatus: finalStatus,
    });

    setSubmitBanner({
      type: 'success',
      text: `Saved field record for ${formData.siteId} in Local Demonstration Store (${finalStatus}). Site observation history and safety flags have been updated across the platform.`,
    });

    setFormData((prev) => ({
      ...prev,
      measuredDischargeLpm: '',
      notes: '',
      photoEvidenceName: '',
      slopeHazardFlag: false,
      contaminationFlag: false,
    }));
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photoEvidenceName: file.name }));
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <section className="bg-slate-100 border border-slate-300 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5 text-slate-800">
          <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              Field Data Entry Mode:{' '}
              {dataMode === 'demo'
                ? 'Local Demonstration Workflow (In-Memory Store)'
                : 'Live Backend API Mode'}
            </span>
            <span className="text-slate-600">
              Submitted observations immediately update the selected spring’s hydrograph, water
              quality profile, and mandatory safety veto flags within this browser session. They are
              not claimed as synced to an external central government database unless a live backend
              is connected.
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded p-5">
          <h2 className="text-base font-bold text-slate-900">
            Submit Field Verification &amp; Hydro-Geological Spot Check
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Fields marked with * are required. Safety flags automatically update site eligibility.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="fv-site" className="block font-semibold text-slate-700 mb-1">
                  Target Spring / Recharge Site *
                </label>
                <select
                  id="fv-site"
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.name} ({s.tribalHamlet})
                    </option>
                  ))}
                </select>
                {errors.siteId && <p className="text-[#B91C1C] mt-1">{errors.siteId}</p>}
              </div>

              <div>
                <label htmlFor="fv-date" className="block font-semibold text-slate-700 mb-1">
                  Observation Date *
                </label>
                <input
                  id="fv-date"
                  type="date"
                  value={formData.observationDate}
                  onChange={(e) => setFormData({ ...formData, observationDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                />
                {errors.observationDate && (
                  <p className="text-[#B91C1C] mt-1">{errors.observationDate}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="fv-observer" className="block font-semibold text-slate-700 mb-1">
                  Observer / Field Officer Name *
                </label>
                <input
                  id="fv-observer"
                  type="text"
                  placeholder="e.g., S. Jani / Er. K. Patnaik"
                  value={formData.observerName}
                  onChange={(e) => setFormData({ ...formData, observerName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900"
                />
                {errors.observerName && (
                  <p className="text-[#B91C1C] mt-1">{errors.observerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="fv-team" className="block font-semibold text-slate-700 mb-1">
                  Field Team / Gram Panchayat Samiti
                </label>
                <input
                  id="fv-team"
                  type="text"
                  value={formData.teamId}
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="fv-cond" className="block font-semibold text-slate-700 mb-1">
                  Observed Spring Condition *
                </label>
                <select
                  id="fv-cond"
                  value={formData.observedCondition}
                  onChange={(e) => setFormData({ ...formData, observedCondition: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                >
                  <option value="Flowing - Normal">Flowing - Normal</option>
                  <option value="Flowing - Reduced">Flowing - Reduced</option>
                  <option value="Critical Seepage">Critical Seepage (&lt; 3 LPM)</option>
                  <option value="Completely Dry">Completely Dry (0 LPM)</option>
                  <option value="Structural Damage / Siltation">Structural Damage / Siltation</option>
                </select>
              </div>

              <div>
                <label htmlFor="fv-flow" className="block font-semibold text-slate-700 mb-1">
                  Measured Discharge (LPM)
                </label>
                <input
                  id="fv-flow"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 18.5 (leave blank if unmeasured)"
                  value={formData.measuredDischargeLpm}
                  onChange={(e) =>
                    setFormData({ ...formData, measuredDischargeLpm: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                />
                {errors.measuredDischargeLpm && (
                  <p className="text-[#B91C1C] mt-1">{errors.measuredDischargeLpm}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="fv-ph" className="block font-semibold text-slate-700 mb-1">
                  pH (Spot Check)
                </label>
                <input
                  id="fv-ph"
                  type="number"
                  step="0.1"
                  placeholder="6.8"
                  value={formData.ph}
                  onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
                {errors.ph && <p className="text-[#B91C1C] mt-1">{errors.ph}</p>}
              </div>
              <div>
                <label htmlFor="fv-tds" className="block font-semibold text-slate-700 mb-1">
                  TDS (mg/L)
                </label>
                <input
                  id="fv-tds"
                  type="number"
                  placeholder="140"
                  value={formData.tdsMgL}
                  onChange={(e) => setFormData({ ...formData, tdsMgL: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label htmlFor="fv-ec" className="block font-semibold text-slate-700 mb-1">
                  EC (µS/cm)
                </label>
                <input
                  id="fv-ec"
                  type="number"
                  placeholder="220"
                  value={formData.ecUsCm}
                  onChange={(e) => setFormData({ ...formData, ecUsCm: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="fv-lat" className="block font-semibold text-slate-700 mb-1">
                  GPS Latitude (°N, WGS84) *
                </label>
                <input
                  id="fv-lat"
                  type="text"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
                {errors.lat && <p className="text-[#B91C1C] mt-1">{errors.lat}</p>}
              </div>
              <div>
                <label htmlFor="fv-lon" className="block font-semibold text-slate-700 mb-1">
                  GPS Longitude (°E, WGS84) *
                </label>
                <input
                  id="fv-lon"
                  type="text"
                  value={formData.lon}
                  onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                />
                {errors.lon && <p className="text-[#B91C1C] mt-1">{errors.lon}</p>}
              </div>
            </div>

            <div className="p-3 bg-red-50/60 border border-red-200 rounded space-y-2">
              <div className="font-bold text-slate-900">
                Field Safety &amp; Contamination Screening Flags
              </div>
              <label className="flex items-start gap-2 cursor-pointer text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.slopeHazardFlag}
                  onChange={(e) =>
                    setFormData({ ...formData, slopeHazardFlag: e.target.checked })
                  }
                  className="mt-0.5 rounded border-red-300 text-[#B91C1C]"
                />
                <span>
                  <strong>Flag Steep Slope / Landslide Hazard (&gt; 35° or Tension Cracks):</strong>{' '}
                  Triggers mandatory Safety Veto on structural excavation for this site.
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.contaminationFlag}
                  onChange={(e) =>
                    setFormData({ ...formData, contaminationFlag: e.target.checked })
                  }
                  className="mt-0.5 rounded border-red-300 text-[#B91C1C]"
                />
                <span>
                  <strong>Flag Upslope Sanitation / Contamination Source (&lt; 50 m):</strong>{' '}
                  Prohibits direct recharge injection until sanitary buffer is restored.
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="fv-photo" className="block font-semibold text-slate-700 mb-1">
                  Field Photo Evidence (Optional)
                </label>
                <input
                  id="fv-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border file:border-slate-300 file:text-xs file:font-medium file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                />
              </div>

              <div>
                <label htmlFor="fv-status" className="block font-semibold text-slate-700 mb-1">
                  Submission Status *
                </label>
                <select
                  id="fv-status"
                  value={formData.verificationStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, verificationStatus: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                >
                  <option value="Draft">Draft (Pending Supervisor Review)</option>
                  <option value="Verified">Verified (Confirmed Field Record)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="fv-notes" className="block font-semibold text-slate-700 mb-1">
                Field Hydro-Geological &amp; Community Notes *
              </label>
              <textarea
                id="fv-notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Describe outcrop fracture orientation, spring box condition, or community water committee feedback..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
              />
              {errors.notes && <p className="text-[#B91C1C] mt-1">{errors.notes}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded transition-colors"
            >
              Save Field Verification Record (Local Demo Store)
            </button>
          </form>

          {submitBanner && (
            <div
              className={`mt-4 p-3 rounded border text-xs ${
                submitBanner.type === 'error'
                  ? 'bg-red-50 border-red-300 text-[#B91C1C]'
                  : 'bg-emerald-50 border-emerald-300 text-[#15803D]'
              }`}
            >
              {submitBanner.text}
            </div>
          )}
        </section>

        <section className="lg:col-span-6 bg-white border border-slate-200 rounded p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Field Verification Records ({fieldVerifications.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distinguishing Draft entries, Verified records, and Safety-Flagged observations
              </p>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[680px] pr-1">
            {fieldVerifications.map((rec) => {
              const isDraft = rec.verificationStatus === 'Draft';
              const isFlagged = rec.verificationStatus.includes('Flagged');

              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded border text-xs ${
                    isFlagged
                      ? 'bg-red-50/40 border-red-200'
                      : isDraft
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-mono text-[11px] text-slate-500">
                      {rec.id} · {rec.observationDate} · {rec.storageMode}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          isFlagged
                            ? 'text-[#B91C1C]'
                            : isDraft
                            ? 'text-[#B45309]'
                            : 'text-[#15803D]'
                        }`}
                      >
                        Status: {rec.verificationStatus}
                      </span>
                      {isDraft && (
                        <button
                          type="button"
                          onClick={() => updateFieldVerificationStatus(rec.id, 'Verified')}
                          className="px-2 py-0.5 bg-[#15803D] text-white rounded text-[11px] font-semibold hover:bg-emerald-800"
                        >
                          Approve &amp; Verify
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteFieldVerification(rec.id)}
                        title="Delete record"
                        className="p-1 text-slate-400 hover:text-[#B91C1C]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {rec.siteId} — {rec.siteName}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700 font-mono text-[11px]">
                    <span>Condition: {rec.observedCondition}</span>
                    <span>
                      Flow: {formatDischarge(rec.measuredDischargeLpm, settings.dischargeUnit)}
                    </span>
                    {rec.ph && <span>pH: {rec.ph}</span>}
                    {rec.tdsMgL && <span>TDS: {rec.tdsMgL} mg/L</span>}
                  </div>

                  <p className="mt-2 text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                    {rec.notes}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Observer: <strong>{rec.observerName}</strong> ({rec.teamId})
                    </span>
                    <span className="font-mono">
                      GPS: {rec.coordinates.lat.toFixed(4)}°N, {rec.coordinates.lon.toFixed(4)}°E
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
