/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic Frontend App
 * Purpose: Frontend Strategic mandiri untuk map planner dan data operasional anggota.
 */

import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "../lib/strategicAuth";
import StrategicCustomMapPlannerPage from "./StrategicCustomMapPlannerPage";
import StrategicCustomMapsPage from "./StrategicCustomMapsPage";
import StrategicDashboardPage from "./StrategicDashboardPage";
import StrategicLayout from "./StrategicLayout";
import StrategicMapPlannerUsersPage from "./StrategicMapPlannerUsersPage";
import StrategicServerAddressesPage from "./StrategicServerAddressesPage";
import StrategicSavesPage from "./StrategicSavesPage";
import StrategicLoginPortal from "../pages/StrategicLoginPortal";

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06090b] font-sans text-stone-100">
      <div className="rounded-[28px] border border-white/8 bg-white/[0.04] px-8 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
        <p className="font-public text-[10px] uppercase tracking-[0.32em] text-lime-300/80">
          Strategic Session
        </p>
        <p className="mt-3 text-sm text-stone-300">Memeriksa sesi Strategic...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ requiredScope, redirectTo }) {
  const { loading, isScopeAuthenticated } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return isScopeAuthenticated(requiredScope) ? (
    <Outlet />
  ) : (
    <Navigate to={redirectTo} replace />
  );
}

function RootRedirect() {
  const { loading, user } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user?.scope === "strategic") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}

export default function StrategicApp() {
  return (
    <Routes>
      <Route path="/" element={<StrategicLoginPortal />} />

      <Route element={<ProtectedRoute requiredScope="strategic" redirectTo="/" />}>
        <Route path="/dashboard" element={<StrategicLayout />}>
          <Route index element={<StrategicDashboardPage />} />
          <Route path="custom-maps" element={<StrategicCustomMapsPage />} />
          <Route path="custom-maps/:mapId" element={<StrategicCustomMapPlannerPage />} />
          <Route path="saves" element={<StrategicSavesPage />} />
          <Route path="server-addresses" element={<StrategicServerAddressesPage />} />
          <Route path="users" element={<StrategicMapPlannerUsersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
