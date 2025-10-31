import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Auth from "./components/Auth";
import Dashboard from "./pages/Dashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import Footer from "./components/Footer";
import Candidates from "./pages/Candidates";
import CandidateProfile from "./pages/CandidateProfile";

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/candidate" element={<CandidateDashboard />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/candidate-profile" element={<CandidateProfile />} />
      </Routes>
      <Footer />
    </Router>
  );
}
