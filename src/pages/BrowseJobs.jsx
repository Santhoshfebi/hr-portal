import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Send } from "lucide-react";

export default function BrowseJobs({ user, toast }) {
  const [jobs, setJobs] = useState([]);
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, company_name, location, description, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast("Failed to load jobs", "error");
    } else {
      setJobs(data);
    }
  };

  const handleApply = async (jobId) => {
    if (!user) return toast("You must be signed in to apply", "error");

    try {
      setApplying(jobId);

      // Get candidate record
      const { data: candidate, error: candidateError } = await supabase
        .from("candidates")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (candidateError || !candidate) throw new Error("Candidate profile not found");

      // Prevent duplicate application
      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", jobId)
        .eq("candidate_id", candidate.id)
        .single();

      if (existing) {
        toast("You already applied for this job.", "warning");
        return;
      }

      const { error } = await supabase
        .from("applications")
        .insert([{ job_id: jobId, candidate_id: candidate.id }]);

      if (error) throw error;

      toast("Application submitted successfully!", "success");
    } catch (err) {
      console.error(err);
      toast(err.message || "Failed to apply", "error");
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Browse Jobs</h1>
      <p className="text-gray-500">Find open positions and apply directly.</p>

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <div className="text-gray-600">No open jobs right now.</div>
        ) : (
          jobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">{job.title}</h2>
                <button
                  onClick={() => handleApply(job.id)}
                  disabled={applying === job.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
                    applying === job.id
                      ? "bg-sky-400 cursor-not-allowed"
                      : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  <Send size={16} />
                  {applying === job.id ? "Applying..." : "Apply"}
                </button>
              </div>
              <p className="text-gray-600 mb-2">{job.company_name}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin size={14} />
                {job.location || "Remote"}
              </p>
              <p className="text-sm text-gray-600 mt-3 line-clamp-3">{job.description}</p>
              <p className="text-xs text-gray-400 mt-2">
                Posted on {new Date(job.created_at).toLocaleDateString()}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
