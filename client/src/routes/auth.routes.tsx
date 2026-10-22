import { Route } from "react-router-dom";
import { PublicRoute } from "../components/auth/PublicRoute";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";

export const authRoutes = (
  <Route element={<PublicRoute />}>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
  </Route>
);
