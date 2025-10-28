// src/pages/Candidates.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const { data, error } = await supabase
          .from("candidates")
          .select("full_name, email, phone, education, experience, skills, resume_url, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCandidates(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading candidates...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white pt-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-10"
      >
        <h1 className="text-4xl font-extrabold text-blue-700 mb-8 text-center">
          Candidate Profiles
        </h1>

        {candidates.length === 0 ? (
          <p className="text-center text-gray-600">No candidates found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((c, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.03 }}
                className="border border-gray-200 rounded-2xl p-6 bg-white shadow hover:shadow-lg transition"
              >
                <h2 className="text-xl font-semibold text-blue-700 mb-2">
                  {c.full_name || "Unnamed Candidate"}
                </h2>
                <p className="text-gray-600 text-sm mb-1">
                  📧 {c.email || "Not provided"}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  📞 {c.phone || "Not provided"}
                </p>

                <div className="text-gray-700 text-sm space-y-2 mb-4">
                  <p>
                    <span className="font-medium">🎓 Education:</span>{" "}
                    {c.education || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">💼 Experience:</span>{" "}
                    {c.experience || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">🛠 Skills:</span>{" "}
                    {c.skills || "N/A"}
                  </p>
                </div>

                {c.resume_url ? (
                  <a
                    href={c.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                  >
                    📄 View Resume
                  </a>
                ) : (
                  <p className="text-sm text-gray-500 italic text-center">
                    No resume uploaded
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
