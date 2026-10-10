import React from 'react';
import { Database, ShieldAlert } from 'lucide-react';
import { useBhujalStore } from '../store/useBhujalStore';

export default function DataMethodology() {
  const { datasets, methodology } = useBhujalStore();

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      <section className="bg-white border border-slate-200 rounded p-5">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Data Provenance Registry &amp; Hydro-Geomorphic Methodology
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-4xl leading-relaxed">
              This section documents every dataset, remote-sensing proxy, field sample series, and
              mathematical heuristic used in BHUJAL (SIH Problem Statement 26240). In strict
              adherence to scientific integrity standards, BHUJAL distinguishes between observed
              field records, satellite-derived proxies, and illustrative calculations, and never
              claims unvalidated heuristics as trained machine-learning models.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded p-5">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          01. Platform Dataset Registry &amp; Limitations
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Complete provenance metadata for spatial, climatic, and hydrogeological inputs
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="py-2.5 px-3 font-semibold">ID &amp; Dataset Name</th>
                <th className="py-2.5 px-3 font-semibold">Source / Provider</th>
                <th className="py-2.5 px-3 font-semibold">Coverage &amp; Period</th>
                <th className="py-2.5 px-3 font-semibold">Resolution &amp; Units</th>
                <th className="py-2.5 px-3 font-semibold">Processing &amp; Transformation</th>
                <th className="py-2.5 px-3 font-semibold">Known Limitations</th>
                <th className="py-2.5 px-3 font-semibold">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 align-top">
              {datasets.map((ds) => (
                <tr key={ds.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-slate-900 block">{ds.id}</span>
                    <span className="font-semibold text-slate-800">{ds.name}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{ds.provider}</td>
                  <td className="py-3 px-3 text-slate-600">
                    <div>{ds.coverage}</div>
                    <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                      {ds.timePeriod}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                    <div>{ds.resolution}</div>
                    <div className="text-slate-500 mt-0.5">{ds.units}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs">{ds.processing}</td>
                  <td className="py-3 px-3 text-amber-900 bg-amber-50/30 max-w-xs">
                    {ds.limitations}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                    {ds.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              02. {methodology.suitabilityFormula.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {methodology.suitabilityFormula.disclaimer}
            </p>
          </div>

          <div className="p-3.5 bg-slate-900 text-slate-100 rounded font-mono text-xs overflow-x-auto">
            <div className="text-slate-400 text-[11px] mb-1">
              Weighted Linear Suitability Heuristic:
            </div>
            <div>{methodology.suitabilityFormula.equation}</div>
          </div>

          <div className="p-3.5 bg-red-50 border border-red-300 rounded text-xs text-[#B91C1C]">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Mandatory Non-Compensatory Safety Gate Rule:</span>
            </div>
            <p className="font-mono text-[11px] mt-1">
              {methodology.suitabilityFormula.safetyGateRule}
            </p>
            <p className="mt-1 text-red-900">
              Rationale: In steep colluvial hillslopes or contaminated village fringes, high
              infiltration or fracture density increases catastrophic slope failure or aquifer
              pollution risk. Therefore, safety constraints act as a strict boolean veto that
              cannot be outweighed by a high AHP score.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <th className="py-2 px-3 font-semibold">Parameter</th>
                  <th className="py-2 px-3 font-semibold text-right">Weight</th>
                  <th className="py-2 px-3 font-semibold">Hydrogeological Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {methodology.suitabilityFormula.weights.map((w, i) => (
                  <tr key={i}>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                      {w.parameter}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2563EB]">
                      {w.weight}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{w.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              03. {methodology.scenarioSimulationModel.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {methodology.scenarioSimulationModel.disclaimer}
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2 font-mono text-[11px] text-slate-800">
              {methodology.scenarioSimulationModel.equations.map((eq, idx) => (
                <div key={idx} className="pb-1.5 border-b border-slate-200 last:border-b-0">
                  {eq}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-5 space-y-2 text-xs text-slate-700">
            <h3 className="text-base font-bold text-slate-900">
              04. Coordinate Reference System &amp; Spatial Standards
            </h3>
            <p>
              <strong>Primary Geographic CRS:</strong> WGS 84 (EPSG:4326) decimal degrees for all
              interactive web-mapping and field GPS logging.
            </p>
            <p>
              <strong>Area &amp; Terrain Derivatives:</strong> Catchment areas (Ha) and slope
              gradients (degrees) are pre-computed in UTM Zone 44N (EPSG:32644 for Koraput/Dindori)
              and UTM Zone 43N (EPSG:32643 for Nandurbar) to prevent angular distortion before
              re-projecting vector boundaries to EPSG:4326 for MapLibre display.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
