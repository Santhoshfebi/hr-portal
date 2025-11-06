import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  Loader2,
  FileText,
  XCircle,
  ExternalLink,
  Building2,
  Briefcase,
  CheckCircle,
  XOctagon,
  Clock,
  Undo2,
  MapPin,
  X,
  Brain,
} from "lucide-react";

/* ---------------- Status Toast ---------------- */
function StatusToast({ message, type, onClose }) {
  const icons = {
    Accepted: <CheckCircle className="text-emerald-500" size={18} />,
    Rejected: <XOctagon className="text-rose-500" size={18} />,
    Pending: <Clock className="text-amber-500" size={18} />,
    Withdrawn: <Undo2 className="text-gray-400" size={18} />,
    Error: <XCircle className="text-rose-500" size={18} />,
  };

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg px-4 py-3 flex items-center gap-3"
        >
          {icons[type] || <Clock className="text-sky-500" size={18} />}
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {message}
          </span>
          <button
            onClick={onClose}
            className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function MyApplications({ user, toast }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    interview:0,
    hired: 0,
    rejected: 0,
    withdrawn: 0,
  });
  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState("Pending");

  /* ---------------- Fetch Applications ---------------- */
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const { data, error } = await supabase
          .from("applications")
          .select(
            `
            id,
            status,
            created_at,
            cover_letter_url,
            resume_url,
            jobs (
              id,
              title,
              company_name,
              location
            )
          `
          )
          .eq("candidate_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setApplications(data || []);
        calculateStats(data || []);
      } catch (err) {
        console.error("Fetch applications error:", err);
        toast("Failed to load applications.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user, toast]);

  /* ---------------- Compute Stats ---------------- */
  const calculateStats = (apps) => {
    const countByStatus = (status) =>
      apps.filter((a) => a.status === status).length;
    setStats({
      total: apps.length,
      pending: countByStatus("Pending"),
      reviewed: countByStatus("Reviewed"),
      interview: countByStatus("Interview"),
      hired: countByStatus("Hired"),
      rejected: countByStatus("Rejected"),
      withdrawn: countByStatus("Withdrawn"),
    });
  };

  /* ---------------- Withdraw Application ---------------- */
  const handleWithdraw = async (id) => {
    if (!confirm("Are you sure you want to withdraw this application?")) return;
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "Withdrawn" })
        .eq("id", id)
        .eq("candidate_id", user.id);

      if (error) throw error;

      const updated = applications.map((app) =>
        app.id === id ? { ...app, status: "Withdrawn" } : app
      );
      setApplications(updated);
      calculateStats(updated);

      setToastType("Withdrawn");
      setToastMsg("Application withdrawn successfully!");
    } catch (err) {
      console.error("Withdraw error:", err);
      setToastType("Error");
      setToastMsg("Failed to withdraw. Please try again.");
    }
  };

  /* ---------------- Fetch Job Details ---------------- */
  const openJobDetails = async (jobId) => {
    setSelectedJob(jobId);
    setJobDetails(null);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, company_name, location, description, requirements, created_at")
        .eq("id", jobId)
        .single();

      if (error) throw error;
      setJobDetails(data);
    } catch (err) {
      console.error("Job details fetch error:", err);
      toast("Failed to load job details.", "error");
    }
  };

  const closeModal = () => {
    setSelectedJob(null);
    setJobDetails(null);
  };

  /* ---------------- Close Modal on ESC ---------------- */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && selectedJob) closeModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedJob]);

  /* ---------------- Auto Hide Toast ---------------- */
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  /* ---------------- Loading State ---------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sky-600 dark:text-sky-400">
        <Loader2 className="animate-spin mr-2" />
        Loading your applications...
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          No applications yet
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Start applying for jobs from the Browse Jobs section.
        </p>
      </div>
    );
  }

  /* ---------------- Render ---------------- */
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          My Applications
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Track all your job applications and their statuses in one place.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={<Briefcase size={18} />} label="Total" value={stats.total} color="bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300" />
        <StatCard icon={<Clock size={18} />} label="Pending" value={stats.pending} color="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" />
        <StatCard icon={<Brain size={18} />} label="Interview" value={stats.interview} color="bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300" />
        <StatCard icon={<CheckCircle size={18} />} label="Accepted" value={stats.hired} color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" />
        <StatCard icon={<XOctagon size={18} />} label="Rejected" value={stats.rejected} color="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300" />
        <StatCard icon={<Undo2 size={18} />} label="Withdrawn" value={stats.withdrawn} color="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300" />
      </div>

      {/* Applications List */}
      <div className="grid grid-cols-1 gap-6">
        {applications.map((app) => (
          <div key={app.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <button
                  onClick={() => openJobDetails(app.jobs?.id)}
                  className="text-lg font-semibold text-sky-700 dark:text-sky-400 hover:underline"
                >
                  {app.jobs?.title || "Untitled Position"}
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {app.jobs?.company_name || "Unknown Company"} • {" "}
                  {app.jobs?.location || "Remote"}
                </p>
              </div>

              <div
                className={`text-sm font-semibold px-3 py-1.5 rounded-full ${app.status === "Pending"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : app.status === "Reviewed"
                    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                    : app.status === "Hired"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : app.status === "Withdrawn"
                        ? "bg-blue-200 text-black-100 dark:bg-blue-900/40 dark:text-black-300"
                        : app.status === "Rejected"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
              >
                {app.status}
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Applied on : {" "}
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {new Date(app.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
              {app.resume_url && (
                <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/40 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-800 transition">
                  <FileText size={16} /> View Resume
                </a>
              )}
              {app.cover_letter_url && (
                <a href={app.cover_letter_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <ExternalLink size={16} /> View Cover Letter
                </a>
              )}
              {app.status !== "Withdrawn" && app.status !== "Rejected" && app.status !== "Accepted" && (
                <button
                  onClick={() => handleWithdraw(app.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-800 transition"
                >
                  <XCircle size={16} /> Withdraw
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Job Modal */}
      <AnimatePresence>
        {selectedJob && jobDetails && (
          <motion.div
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-end z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="w-full sm:w-[480px] bg-white dark:bg-gray-900 h-full p-6 shadow-xl overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {jobDetails.title}
                </h2>
                <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  <X size={18} />
                </button>
              </div>
              <div className="flex gap-6">
                
                <p className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/40 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-800 transition">
                  <Building2 size={16} /> {jobDetails.company_name} 
                </p>
                <p className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/40 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-800 transition">
                  <MapPin size={16} /> {jobDetails.location}
                </p>
              </div>


              <hr className="my-4 border-gray-200 dark:border-gray-700" />

              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line mb-6">
                {jobDetails.description || "No description provided."}
              </p>

              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Requirements</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                {jobDetails.requirements || "No specific requirements listed."}
              </p>

              <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
                Posted on: {new Date(jobDetails.created_at).toLocaleDateString()}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <StatusToast
        message={toastMsg}
        type={toastType}
        onClose={() => setToastMsg(null)}
      />
    </div>
  );
}

/* ---------------- StatCard ---------------- */
function StatCard({ icon, label, value, color }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700 shadow-sm ${color}`}
    >
      <div className="mb-1">{icon}</div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );
}
