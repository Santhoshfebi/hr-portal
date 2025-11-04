import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { MapPin, Building2, DollarSign, Calendar } from "lucide-react";

export default function BrowseJobs({ user, toast }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  /* ---------------- Fetch Open Jobs ---------------- */
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, description, location, company_name, salary_range, created_at")
        .eq("status", "Open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      toast("Unable to load jobs.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Apply for a Job ---------------- */
  const handleApply = async (job_id) => {
    try {
      if (!user) {
        toast("Please sign in to apply for jobs.", "error");
        return;
      }

      setApplying(true);

      // Step 1: Check if already applied
      const { data: existing, error: checkError } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", job_id)
        .eq("candidate_id", user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        toast("You’ve already applied for this job.", "info");
        return;
      }

      // Step 2: Submit application
     const { error: insertError } = await supabase.from("applications").insert([
  {
    job_id,
    candidate_id: user.id,
    full_name: user.user_metadata?.full_name || user.email,
    email: user.email, // ✅ add this line
    status: "Pending",
  },
]);


      if (insertError) throw insertError;

      toast("Application submitted successfully!", "success");
    } catch (err) {
      console.error("Apply error:", err);
      toast("Could not submit your application.", "error");
    } finally {
      setApplying(false);
    }
  };

  /* ---------------- Format Date ---------------- */
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* ---------------- Render ---------------- */
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 animate-pulse">
        Loading jobs...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Browse Jobs</h1>
      </div>

      {/* Job List */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-xl">
            No open jobs available right now.
          </div>
        )}

        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                {job.title}
              </h2>
              <div className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                <Building2 size={15} /> {job.company_name || "Company"}
              </div>

              <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                {job.description}
              </p>

              {job.location && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <MapPin size={14} /> {job.location}
                </div>
              )}

              {job.salary_range && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <DollarSign size={14} /> {job.salary_range}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <Calendar size={13} />
                Posted {formatDate(job.created_at)}
              </div>
            </div>

            <button
              onClick={() => handleApply(job.id)}
              disabled={applying}
              className={`mt-5 w-full py-2 rounded-lg text-white transition font-medium ${
                applying
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-sky-600 hover:bg-sky-700"
              }`}
            >
              {applying ? "Applying..." : "Apply Now"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
