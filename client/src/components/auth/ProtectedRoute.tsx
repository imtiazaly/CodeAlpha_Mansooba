import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../../store";

export const ProtectedRoute = () => {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
