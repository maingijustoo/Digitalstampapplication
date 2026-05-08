import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Home } from "./pages/Home";
import { ReportFraud } from "./pages/ReportFraud";
import { ApplyStamp } from "./pages/ApplyStamp";
import { BusinessPortal } from "./pages/BusinessPortal";
import { VerifyBusiness } from "./pages/VerifyBusiness";
import { About } from "./pages/About";
import { ScamAlerts } from "./pages/ScamAlerts";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "report-fraud", Component: ReportFraud },
      { path: "apply-stamp", Component: ApplyStamp },
      { path: "business-portal", Component: BusinessPortal },
      { path: "verify", Component: VerifyBusiness },
      { path: "about", Component: About },
      { path: "scam-alerts", Component: ScamAlerts },
      { path: "*", Component: NotFound },
    ],
  },
]);
