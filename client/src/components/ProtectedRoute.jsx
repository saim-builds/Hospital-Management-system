import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <p className="p-8 text-muted">Loading...</p>;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}