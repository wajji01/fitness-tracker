import { useState, useEffect, Suspense, lazy } from "react";
import { API_BASE, authHeaders } from "../../config/api";
import axios from "axios";
import Sidebar          from "./components/Sidebar";
import TopBar           from "./components/TopBar";
import DashboardHome    from "./components/DashboardHome";
import FitnessChatbot   from "./components/FitnessChatbot";

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
      {/* AI Chatbot — floats on all pages */}
      <FitnessChatbot />
    </div>
  );
}

function ComingSoon({ page }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
        </svg>
      </div>
      <div>
        <p className="font-bold text-gray-800 capitalize">{page}</p>
        <p className="text-sm text-gray-400 mt-1">Coming soon — under development</p>
      </div>
      {/* AI Chatbot — floats on all pages */}
      <FitnessChatbot />
    </div>
  );
}

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState("dashboard");
  const [user,       setUser]       = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/users/me`, authHeaders());
        setUser(data.user || data);
      } catch {
        // silently fail — user stays null
      }
    };
    fetchUser();
  }, []);

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
      <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} />
      <main className="flex-1 lg:ml-60 min-h-screen flex flex-col">
        <TopBar activePage={activePage} user={user} setActivePage={setActivePage} />
        <div className="flex-1 p-6">
          <div key={activePage} className="page-enter">
            {renderContent()}
          </div>
        </div>
      </main>
      {/* AI Chatbot — floats on all pages */}
      <FitnessChatbot />
    </div>
  );
}