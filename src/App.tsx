/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import OverviewDashboard from './pages/OverviewDashboard';
import SpatialExplorer from './pages/SpatialExplorer';
import SiteAnalysis from './pages/SiteAnalysis';
import InterventionPlanner from './pages/InterventionPlanner';
import ScenarioSimulator from './pages/ScenarioSimulator';
import SpringMonitoring from './pages/SpringMonitoring';
import FieldVerification from './pages/FieldVerification';
import Reports from './pages/Reports';
import DataMethodology from './pages/DataMethodology';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<OverviewDashboard />} />
          <Route path="/spatial-explorer" element={<SpatialExplorer />} />
          <Route path="/site-analysis" element={<SiteAnalysis />} />
          <Route path="/intervention-planner" element={<InterventionPlanner />} />
          <Route path="/scenario-simulator" element={<ScenarioSimulator />} />
          <Route path="/spring-monitoring" element={<SpringMonitoring />} />
          <Route path="/field-verification" element={<FieldVerification />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/data-methodology" element={<DataMethodology />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
