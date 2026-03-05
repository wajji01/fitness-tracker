import { useState, Suspense, lazy } from "react";
import Sidebar       from "./components/Sidebar";
import TopBar        from "./components/TopBar";
import DashboardHome from "./components/DashboardHome";

const WorkoutsPanel = lazy(() => import("./pages/WorkoutsPanel"));
const Nutrition     = lazy(() => import("./pages/Nutrition"));
const Progress      = lazy(() => import("./pages/Progress"));
const Settings      = lazy(() => import("./pages/Settings"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20 gap-3">
      <svg className="w-6 h-6 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-sm text-gray-400">Loading...</span>
    </div>
  );
}

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState("dashboard");

  const renderContent = () => {
    switch (activePage) {
      case "dashboard": return <DashboardHome onGoToWorkouts={() => setActivePage("workouts")} />;
      case "workouts":  return <Suspense fallback={<PageLoader />}><WorkoutsPanel /></Suspense>;
      case "nutrition": return <Suspense fallback={<PageLoader />}><Nutrition /></Suspense>;
      case "progress":  return <Suspense fallback={<PageLoader />}><Progress /></Suspense>;
      case "settings":  return <Suspense fallback={<PageLoader />}><Settings /></Suspense>;
      default:          return <DashboardHome onGoToWorkouts={() => setActivePage("workouts")} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased flex">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 lg:ml-60 min-h-screen flex flex-col">
        <TopBar activePage={activePage} />
        <div className="flex-1 p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}