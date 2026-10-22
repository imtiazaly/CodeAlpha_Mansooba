import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../store";

export const ProtectedRoute = () => {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
