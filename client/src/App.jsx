import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Departments from "./pages/Departments";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import BookAppointment from "./pages/BookAppointment";
import Patients from "./pages/Patients";
import PatientRecord from "./pages/PatientRecord";
import Consultation from "./pages/Consultation";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/patients/:id" element={<PatientRecord />} />

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/departments" element={<Departments />} />
          </Route>
          <Route element={<ProtectedRoute roles={["receptionist", "admin"]} />}>
            <Route path="/patients" element={<Patients />} />
          </Route>
          <Route element={<ProtectedRoute roles={["patient", "receptionist"]} />}>
            <Route path="/appointments/new" element={<BookAppointment />} />
          </Route>
          <Route element={<ProtectedRoute roles={["doctor"]} />}>
            <Route path="/consultations/:appointmentId" element={<Consultation />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<p className="p-8">Page not found</p>} />
    </Routes>
  );
}