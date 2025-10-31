// RecruiterDashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function RecruiterDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        navigate("/auth", { replace: true });
        return;
      }
      setUser(authData.user);
    };
    getUser();
  }, [navigate]);

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-green-50 to-white py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-10 border border-green-100 text-center"
      >
        <h1 className="text-4xl font-extrabold text-green-700 mb-4">
          Recruiter Dashboard
        </h1>
        <p className="text-gray-600 mb-8">
          Welcome back, <span className="font-semibold">{user.email}</span>
        </p>
        <motion.div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-inner">
          <h2 className="text-2xl font-semibold text-green-700 mb-3">
            Recruiter Tools
          </h2>
          <p className="text-gray-600 mb-4">
            View candidates, manage job postings, and contact applicants directly.
          </p>
          <button
            onClick={() => navigate("/candidates")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            View Candidates
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
