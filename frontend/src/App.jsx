import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing         from "./pages/Landing";
import Login           from "./pages/Login";
import Register        from "./pages/Register";
import DashboardLayout from "./pages/dashboard";

function ProtectedRoute({ children }) {
  const isAuthenticated = Boolean(localStorage.getItem("token"));
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<DashboardLayout />} />
        {/* <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          } */}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;