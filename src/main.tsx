/**
 * src/main.tsx  — drop this file into your React project root src/
 *
 * Replaces the Figma-generated main.tsx.
 * Imports the KCPP pages from frontend_api/pages/ which are
 * wired to the Django backend.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";


// Global styles
import "./styles/index.css";
import "./styles/tailwind.css";
import "./frontend_api/kccp.css";

// Layout shell
import { Root } from "./app/Root";

// ── Pages: Figma originals replaced with backend-connected versions ──────────
import { Home }           from "./frontend_api/pages/Home";
import { ApplyStamp }     from "./frontend_api/pages/ApplyStamp";
import { VerifyBusiness } from "./frontend_api/pages/VerifyBusiness";
import { ReportFraud }    from "./frontend_api/pages/ReportFraud";
import { ScamAlerts }     from "./frontend_api/pages/ScamAlerts";
import { BusinessPortal } from "./frontend_api/pages/BusinessPortal";
import { AdminDashboard } from "./frontend_api/pages/AdminDashboard";
// ADD this line alongside the other page imports
// Pages that don't need backend yet (keep originals)
import { About }          from "./app/pages/About";
import { NotFound }       from "./app/pages/NotFound";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Root />}>
          <Route path="/"                element={<Home />} />
          <Route path="/apply-stamp"     element={<ApplyStamp />} />
          <Route path="/verify"          element={<VerifyBusiness />} />
          <Route path="/report-fraud"    element={<ReportFraud />} />
          <Route path="/scam-alerts"     element={<ScamAlerts />} />s
          <Route path="/business-portal" element={<BusinessPortal />} />
          <Route path="/admin-dashboard"  element={<AdminDashboard />} />
          <Route path="/about"           element={<About />} />
          <Route path="*"                element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
