import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Microscope,
  Wrench,
  Sliders,
  Droplets,
  ClipboardCheck,
  FileSpreadsheet,
  Database,
  Settings,
  Menu,
  X,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { useBhujalStore } from '../../store/useBhujalStore';

export const NAV_ITEMS = [
  {
    path: '/',
    label: 'Overview Dashboard',
    shortLabel: 'Overview',
    icon: LayoutDashboard,
    section: 'Core Planning',
  },
  {
    path: '/spatial-explorer',
    label: 'Spatial Explorer',
    shortLabel: 'GIS Map',
    icon: Map,
    section: 'Core Planning',
  },
  {
    path: '/site-analysis',
    label: 'Site Analysis',
    shortLabel: 'Site Analysis',
    icon: Microscope,
    section: 'Core Planning',
  },
  {
    path: '/intervention-planner',
    label: 'Intervention Planner',
    shortLabel: 'Interventions',
    icon: Wrench,
    section: 'Decision Support',
  },
  {
    path: '/scenario-simulator',
    label: 'Scenario Simulator',
    shortLabel: 'Simulator',
    icon: Sliders,
    section: 'Decision Support',
  },
  {
    path: '/spring-monitoring',
    label: 'Spring Monitoring',
    shortLabel: 'Monitoring',
    icon: Droplets,
    section: 'Field Operations',
  },
  {
    path: '/field-verification',
    label: 'Field Verification',
    shortLabel: 'Field Entry',
    icon: ClipboardCheck,
    section: 'Field Operations',
  },
  {
    path: '/reports',
    label: 'Reports & Exports',
    shortLabel: 'Reports',
    icon: FileSpreadsheet,
    section: 'Governance & Reference',
  },
  {
    path: '/data-methodology',
    label: 'Data & Methodology',
    shortLabel: 'Methodology',
    icon: Database,
    section: 'Governance & Reference',
  },
  {
    path: '/settings',
    label: 'Settings',
    shortLabel: 'Settings',
    icon: Settings,
    section: 'Governance & Reference',
  },
];

export default function AppShell({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    regions,
    selectedRegionId,
    setSelectedRegionId,
    dataMode,
    setDataMode,
    liveApiStatus,
    sites,
    selectedSiteId,
  } = useBhujalStore();

  const activeRegion = regions.find((r) => r.id === selectedRegionId) || regions[0];
  const activeSite = sites.find((s) => s.id === selectedSiteId);
  const currentNav =
    NAV_ITEMS.find((item) =>
      item.path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.path)
    ) || NAV_ITEMS[0];

  const regionSites = sites.filter((s) => s.regionId === selectedRegionId);
  const safetyRestrictedCount = regionSites.filter((s) => !s.safetyAssessment.passed).length;

  const sections = ['Core Planning', 'Decision Support', 'Field Operations', 'Governance & Reference'];

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden no-print"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Persistent Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-150 ease-out lg:static lg:translate-x-0 no-print ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#2563EB] shrink-0" />
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                BHUJAL DSS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              SIH 26240 · Spring Revival &amp; Recharge GIS
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Study Area Quick Context */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70">
          <label
            htmlFor="sidebar-region-select"
            className="block text-[11px] font-semibold text-slate-500 mb-1"
          >
            Active Tribal Study Watershed
          </label>
          <select
            id="sidebar-region-select"
            value={selectedRegionId}
            onChange={(e) => setSelectedRegionId(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#2563EB]"
          >
            {regions.map((reg) => (
              <option key={reg.id} value={reg.id}>
                {reg.name} ({reg.state})
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 font-mono tabular-nums">
            <span>{regionSites.length} Mapped Sites</span>
            <span>·</span>
            <span>{activeRegion.annualRainfallMm} mm/yr</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4" aria-label="Main Navigation">
          {sections.map((sectionName) => {
            const sectionItems = NAV_ITEMS.filter((item) => item.section === sectionName);
            return (
              <div key={sectionName}>
                <div className="px-2.5 mb-1.5 text-[11px] font-semibold text-slate-400">
                  {sectionName}
                </div>
                <ul className="space-y-0.5">
                  {sectionItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.path);

                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-[#2563EB] text-white'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 truncate">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-white' : 'text-slate-500'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.path === '/intervention-planner' && safetyRestrictedCount > 0 && (
                            <span
                              title={`${safetyRestrictedCount} site(s) have active safety vetoes`}
                              className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'text-[#B91C1C] bg-red-50'
                              }`}
                            >
                              {safetyRestrictedCount} Veto
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Scientific Mode Indicator */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-600 leading-relaxed">
          <div className="font-semibold text-slate-800 flex items-center justify-between">
            <span>Scientific Integrity Mode</span>
            <span className="font-mono text-[10px] text-slate-500">WGS84 · EPSG:4326</span>
          </div>
          <p className="mt-1 text-slate-500">
            Suitability scores use transparent AHP heuristics. Safety vetoes cannot be overridden.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                <span>{activeRegion.state}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{activeRegion.name}</span>
                {activeSite &&
                  (location.pathname.startsWith('/site-analysis') ||
                    location.pathname.startsWith('/intervention-planner')) && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="font-mono text-slate-700">{activeSite.id}</span>
                    </>
                  )}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {currentNav.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded border border-slate-200"
              role="group"
              aria-label="Data Source Mode"
            >
              <button
                type="button"
                onClick={() => setDataMode('demo')}
                className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
                  dataMode === 'demo'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Demo Dataset
              </button>
              <button
                type="button"
                onClick={() => setDataMode('live')}
                className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
                  dataMode === 'live'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Live API Mode
              </button>
            </div>

            {location.pathname !== '/spatial-explorer' ? (
              <button
                type="button"
                onClick={() => navigate('/spatial-explorer')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded transition-colors whitespace-nowrap shrink-0"
              >
                Open GIS Map
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/site-analysis')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded transition-colors whitespace-nowrap shrink-0"
              >
                Inspect Selected Site
              </button>
            )}
          </div>
        </header>

        {dataMode === 'live' && !liveApiStatus.ok && (
          <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="flex items-start gap-2.5 text-xs text-[#B91C1C]">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">
                  Live API Mode Selected — Backend Unreachable:
                </span>{' '}
                <span>{liveApiStatus.message}</span>
                <span className="block text-red-700 mt-0.5">
                  Per scientific integrity policy, BHUJAL does not silently substitute sample data
                  when a live API call fails. Configure VITE_API_BASE_URL in Settings or switch
                  explicitly to the Curated Demo Dataset.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="px-2.5 py-1 text-xs font-medium bg-white border border-red-300 text-red-800 rounded hover:bg-red-100 whitespace-nowrap"
              >
                Configure API
              </button>
              <button
                type="button"
                onClick={() => setDataMode('demo')}
                className="px-3 py-1 text-xs font-semibold bg-[#B91C1C] text-white rounded hover:bg-red-800 whitespace-nowrap"
              >
                Switch to Demo Dataset
              </button>
            </div>
          </div>
        )}

        {dataMode === 'demo' && (
          <div className="bg-slate-100/80 border-b border-slate-200 px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 no-print">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
              <span>
                <strong>Data Mode: Curated Demonstration Dataset</strong> · Displaying provenance-tagged
                field sample records, remote sensing proxies, and AHP heuristic scores for{' '}
                <strong className="text-slate-800">{activeRegion.name}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/data-methodology')}
              className="text-[#2563EB] hover:underline font-medium whitespace-nowrap"
            >
              View Provenance &amp; Heuristic Equations →
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
