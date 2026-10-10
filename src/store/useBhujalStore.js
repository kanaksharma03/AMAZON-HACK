import { create } from 'zustand';
import {
  STUDY_REGIONS,
  INITIAL_SITES,
  INTERVENTION_CATALOG,
  DATASET_REGISTRY,
  METHODOLOGY_DOCUMENTATION,
} from '../data/demoDataset';
import { checkApiHealth } from '../services/apiService';

const INITIAL_FIELD_VERIFICATIONS = [
  {
    id: 'FV-2026-0914',
    siteId: 'BHJ-KRP-001',
    siteName: 'Deomali Foothill Fracture Spring',
    regionId: 'KORAPUT_OD',
    observationDate: '2026-09-14',
    observerName: 'K. Patnaik',
    teamId: 'Odisha Watershed Cell - Team B',
    observedCondition: 'Flowing - Normal',
    measuredDischargeLpm: 54.0,
    measurementMethod: 'Volumetric Bucket & Stopwatch (3-trial mean)',
    ph: 6.9,
    tdsMgL: 118,
    ecUsCm: 182,
    coordinates: { lat: 18.7864, lon: 82.7682 },
    slopeHazardFlag: false,
    contaminationFlag: false,
    photoEvidenceName: 'deomali_fracture_outcrop_sep2026.jpg',
    notes: 'Clear emergence along fractured khondalite foliation plane. Upslope bench is stable for staggered contour trenching.',
    verificationStatus: 'Verified',
    storageMode: 'Demo Local Record',
  },
  {
    id: 'FV-2026-0829',
    siteId: 'BHJ-KRP-002',
    siteName: 'Kunduli Ridge Contact Spring',
    regionId: 'KORAPUT_OD',
    observationDate: '2026-08-29',
    observerName: 'B. Majhi',
    teamId: 'Block Ground Water Survey - Pottangi',
    observedCondition: 'Critical Seepage',
    measuredDischargeLpm: 2.1,
    measurementMethod: 'Volumetric Bucket & Stopwatch',
    ph: 6.7,
    tdsMgL: 94,
    ecUsCm: 148,
    coordinates: { lat: 18.8045, lon: 82.8012 },
    slopeHazardFlag: true,
    contaminationFlag: false,
    photoEvidenceName: 'kunduli_colluvial_creep_warning.jpg',
    notes: 'SAFETY VETO LOGGED: Upslope gradient measured at 38.6° by clinometer with visible tension cracks in colluvial soil. Excavation strictly prohibited.',
    verificationStatus: 'Flagged - Safety Issue',
    storageMode: 'Demo Local Record',
  },
  {
    id: 'FV-2026-0902',
    siteId: 'BHJ-DND-002',
    siteName: 'Silpidi Nala Fracture Zone',
    regionId: 'DINDORI_MP',
    observationDate: '2026-09-02',
    observerName: 'R. Tekam',
    teamId: 'MPWSM Dindori Field Unit',
    observedCondition: 'Flowing - Normal',
    measuredDischargeLpm: 44.0,
    measurementMethod: '90° V-Notch Portable Weir',
    ph: 7.5,
    tdsMgL: 310,
    ecUsCm: 480,
    coordinates: { lat: 22.9610, lon: 81.0580 },
    slopeHazardFlag: false,
    contaminationFlag: true,
    photoEvidenceName: 'silpidi_upslope_soakpit_buffer.jpg',
    notes: 'WATER QUALITY VETO: Greywater soak pit and cattle pen 28 m upslope. Nitrate spot test elevated at 38.5 mg/L.',
    verificationStatus: 'Flagged - Safety Issue',
    storageMode: 'Demo Local Record',
  },
  {
    id: 'FV-2026-0918',
    siteId: 'BHJ-NDB-001',
    siteName: 'Toranmal Dyke-Barrier Spring',
    regionId: 'NANDURBAR_MH',
    observationDate: '2026-09-18',
    observerName: 'V. Vasave',
    teamId: 'GSDA Tribal Watershed Unit',
    observedCondition: 'Flowing - Normal',
    measuredDischargeLpm: 36.5,
    measurementMethod: 'Volumetric Bucket & Stopwatch',
    ph: 7.6,
    tdsMgL: 210,
    ecUsCm: 325,
    coordinates: { lat: 21.7560, lon: 74.1820 },
    slopeHazardFlag: false,
    contaminationFlag: false,
    photoEvidenceName: 'toranmal_dolerite_dyke_contact.jpg',
    notes: 'E-W dolerite dyke clearly exposed across nala bed; acts as a natural subsurface barrier.',
    verificationStatus: 'Verified',
    storageMode: 'Demo Local Record',
  },
];

const INITIAL_PLANNED_INTERVENTIONS = [
  {
    planId: 'PLAN-001',
    siteId: 'BHJ-KRP-001',
    interventionId: 'INT-SCT',
    quantityUnits: 2,
    estimatedCostInr: 290000,
    expectedRechargeM3: 8400,
    engineerNotes: 'Prioritize 20 Ha upper khondalite bench above Podagada Sabar Sahi before May monsoon onset.',
    status: 'Shortlisted (Pending Field Engineer Sign-off)',
    addedAt: '2026-09-22',
  },
  {
    planId: 'PLAN-002',
    siteId: 'BHJ-KRP-002',
    interventionId: 'INT-SSD',
    quantityUnits: 1,
    estimatedCostInr: 82000,
    expectedRechargeM3: 2100,
    engineerNotes: 'Excavation vetoed due to 38.6° slope. Approved only for non-invasive vegetative sanctuary & brushwood wattles.',
    status: 'Approved Non-Invasive Only',
    addedAt: '2026-09-24',
  },
  {
    planId: 'PLAN-003',
    siteId: 'BHJ-KRP-003',
    interventionId: 'INT-SUB',
    quantityUnits: 1,
    estimatedCostInr: 310000,
    expectedRechargeM3: 9600,
    engineerNotes: 'Sub-surface clay/ferro-cement dyke across Chalanput valley fill to eliminate summer evaporation loss.',
    status: 'Shortlisted (Pending Field Engineer Sign-off)',
    addedAt: '2026-09-25',
  },
];

const DEFAULT_SCENARIO_PARAMS = {
  presetId: 'CLIMATE_STRESS_WITH_INTERVENTION',
  monsoonRainfallChangePct: -12,
  tempAnomalyC: 1.5,
  highIntensityRainLossPct: 10,
  interventionCoveragePct: 75,
  vegetativeRestorationPct: 60,
};

export const useBhujalStore = create((set, get) => ({
  selectedRegionId: 'KORAPUT_OD',
  dataMode: 'demo',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  liveApiStatus: {
    checked: false,
    ok: false,
    loading: false,
    message: 'Using local curated demonstration dataset (SIH 26240).',
    lastChecked: null,
    latencyMs: null,
  },

  regions: STUDY_REGIONS,
  sites: INITIAL_SITES,
  interventionsCatalog: INTERVENTION_CATALOG,
  datasets: DATASET_REGISTRY,
  methodology: METHODOLOGY_DOCUMENTATION,

  selectedSiteId: 'BHJ-KRP-001',

  mapFilters: {
    searchQuery: '',
    suitability: 'ALL',
    dryingRisk: 'ALL',
    siteType: 'ALL',
    safetyStatus: 'ALL',
    colorBy: 'suitability',
  },
  mapLayers: {
    sites: true,
    catchments: true,
    lineaments: true,
    heatZones: true,
  },

  plannedInterventions: INITIAL_PLANNED_INTERVENTIONS,
  scenarioParams: { ...DEFAULT_SCENARIO_PARAMS },
  savedScenarioSnapshots: [],
  fieldVerifications: INITIAL_FIELD_VERIFICATIONS,

  settings: {
    basemapStyle: 'carto-positron',
    coordinateFormat: 'DD',
    dischargeUnit: 'LPM',
    areaUnit: 'HA',
    highlightSafetyVetoes: true,
  },

  setSelectedRegionId: (regionId) => {
    const { sites } = get();
    const firstSiteInRegion = sites.find((s) => s.regionId === regionId);
    set({
      selectedRegionId: regionId,
      selectedSiteId: firstSiteInRegion ? firstSiteInRegion.id : get().selectedSiteId,
    });
  },

  setSelectedSiteId: (siteId) => set({ selectedSiteId: siteId }),

  setDataMode: async (mode) => {
    if (mode === 'demo') {
      set({
        dataMode: 'demo',
        liveApiStatus: {
          checked: true,
          ok: true,
          loading: false,
          message: 'Active: Local Demonstration Dataset Adapter (SIH 26240).',
          lastChecked: new Date().toLocaleTimeString(),
          latencyMs: 0,
        },
      });
      return;
    }

    set({
      dataMode: 'live',
      liveApiStatus: {
        ...get().liveApiStatus,
        loading: true,
        message: 'Testing connection to configured Live API endpoint...',
      },
    });

    const result = await checkApiHealth(get().apiBaseUrl);
    set({
      liveApiStatus: {
        checked: true,
        ok: result.ok,
        loading: false,
        message: result.message,
        lastChecked: new Date().toLocaleTimeString(),
        latencyMs: result.latencyMs,
      },
    });
  },

  setApiBaseUrl: (url) => set({ apiBaseUrl: url }),

  testLiveApiConnection: async () => {
    set((state) => ({
      liveApiStatus: { ...state.liveApiStatus, loading: true },
    }));
    const result = await checkApiHealth(get().apiBaseUrl);
    set({
      liveApiStatus: {
        checked: true,
        ok: result.ok,
        loading: false,
        message: result.message,
        lastChecked: new Date().toLocaleTimeString(),
        latencyMs: result.latencyMs,
      },
    });
    return result;
  },

  updateMapFilters: (partial) =>
    set((state) => ({
      mapFilters: { ...state.mapFilters, ...partial },
    })),

  resetMapFilters: () =>
    set({
      mapFilters: {
        searchQuery: '',
        suitability: 'ALL',
        dryingRisk: 'ALL',
        siteType: 'ALL',
        safetyStatus: 'ALL',
        colorBy: 'suitability',
      },
    }),

  toggleMapLayer: (layerKey) =>
    set((state) => ({
      mapLayers: {
        ...state.mapLayers,
        [layerKey]: !state.mapLayers[layerKey],
      },
    })),

  addPlannedIntervention: (item) =>
    set((state) => {
      const newPlan = {
        ...item,
        planId: `PLAN-${String(state.plannedInterventions.length + 1).padStart(3, '0')}`,
        addedAt: new Date().toISOString().slice(0, 10),
      };
      return {
        plannedInterventions: [newPlan, ...state.plannedInterventions],
      };
    }),

  removePlannedIntervention: (planId) =>
    set((state) => ({
      plannedInterventions: state.plannedInterventions.filter((p) => p.planId !== planId),
    })),

  updateScenarioParams: (partial) =>
    set((state) => ({
      scenarioParams: { ...state.scenarioParams, ...partial },
    })),

  resetScenarioParams: () =>
    set({
      scenarioParams: { ...DEFAULT_SCENARIO_PARAMS },
    }),

  saveScenarioSnapshot: (snapshot) =>
    set((state) => ({
      savedScenarioSnapshots: [
        {
          id: `SIM-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toLocaleTimeString(),
          ...snapshot,
        },
        ...state.savedScenarioSnapshots,
      ],
    })),

  addFieldVerification: (record) =>
    set((state) => {
      const newId = `FV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(
        state.fieldVerifications.length + 1
      ).padStart(2, '0')}`;

      const fullRecord = {
        ...record,
        id: newId,
        storageMode: state.dataMode === 'live' ? 'Live API Submission' : 'Demo Local Record',
      };

      const updatedSites = state.sites.map((site) => {
        if (site.id !== record.siteId) return site;

        const hasSafetyIssue = Boolean(record.slopeHazardFlag || record.contaminationFlag);
        const updatedSafety = hasSafetyIssue
          ? {
              ...site.safetyAssessment,
              passed: false,
              vetoReason: record.slopeHazardFlag
                ? 'Field Verification Flagged: Excessive upslope gradient / slope instability hazard.'
                : 'Field Verification Flagged: Upslope water quality / sanitation contamination hazard (< 50 m buffer).',
              requiresFieldEngineerSignoff: true,
            }
          : site.safetyAssessment;

        const newObs =
          record.measuredDischargeLpm !== null && record.measuredDischargeLpm !== ''
            ? [
                ...site.hydrology.historicalObservations,
                {
                  date: record.observationDate,
                  season: 'Field Verification',
                  dischargeLpm: Number(record.measuredDischargeLpm),
                  condition: record.observedCondition,
                  observer: `${record.observerName} (${record.teamId})`,
                  provenance: 'Field Measured (Local Entry)',
                },
              ]
            : site.hydrology.historicalObservations;

        return {
          ...site,
          verificationStatus: record.verificationStatus,
          lastVerifiedDate: record.observationDate,
          suitabilityCategory: hasSafetyIssue ? 'Safety Restricted' : site.suitabilityCategory,
          safetyAssessment: updatedSafety,
          hydrology: {
            ...site.hydrology,
            historicalObservations: newObs,
            waterQuality: {
              ...site.hydrology.waterQuality,
              ph: record.ph ? Number(record.ph) : site.hydrology.waterQuality.ph,
              tdsMgL: record.tdsMgL ? Number(record.tdsMgL) : site.hydrology.waterQuality.tdsMgL,
              ecUsCm: record.ecUsCm ? Number(record.ecUsCm) : site.hydrology.waterQuality.ecUsCm,
              provenance:
                record.ph || record.tdsMgL
                  ? 'Field Measured (Local Entry)'
                  : site.hydrology.waterQuality.provenance,
            },
          },
        };
      });

      return {
        fieldVerifications: [fullRecord, ...state.fieldVerifications],
        sites: updatedSites,
      };
    }),

  updateFieldVerificationStatus: (id, newStatus) =>
    set((state) => ({
      fieldVerifications: state.fieldVerifications.map((fv) =>
        fv.id === id ? { ...fv, verificationStatus: newStatus } : fv
      ),
    })),

  deleteFieldVerification: (id) =>
    set((state) => ({
      fieldVerifications: state.fieldVerifications.filter((fv) => fv.id !== id),
    })),

  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  resetAllDemoData: () =>
    set({
      selectedRegionId: 'KORAPUT_OD',
      selectedSiteId: 'BHJ-KRP-001',
      sites: INITIAL_SITES,
      plannedInterventions: INITIAL_PLANNED_INTERVENTIONS,
      fieldVerifications: INITIAL_FIELD_VERIFICATIONS,
      scenarioParams: { ...DEFAULT_SCENARIO_PARAMS },
      savedScenarioSnapshots: [],
    }),
}));
