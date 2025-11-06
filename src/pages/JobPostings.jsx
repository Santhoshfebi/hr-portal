import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  Plus,
  Edit3,
  Trash2,
  Users,
  Clock,
  Building2,
  MapPin,
  DollarSign,
  X,
} from "lucide-react";

export default function JobPostings({ user, toast }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    id: null,
    title: "",
    description: "",
    requirements: "",
    location: "",
    company_name: "",
    salary_range: "",
    status: "Open",
  });
  const panelRef = useRef(null);

  /* ---------------- Fetch Recruiter Jobs ---------------- */
  useEffect(() => {
    if (!user) return;
    fetchJobs();

    // Realtime updates
    const channel = supabase
      .channel("recruiter-jobs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          filter: `recruiter_id=eq.${user.id}`,
        },
        (payload) => handleRealtimeChange(payload)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id, title, description, requirements, location, company_name, salary_range, status, applicant_count, created_at, updated_at"
        )
        .eq("recruiter_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error("Fetch jobs error:", err);
      toast("Unable to load job postings.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeChange = (payload) => {
    const { eventType, new: newJob, old: oldJob } = payload;
    setJobs((prev) => {
      switch (eventType) {
        case "INSERT":
          return [newJob, ...prev];
        case "UPDATE":
          return prev.map((j) => (j.id === newJob.id ? newJob : j));
        case "DELETE":
          return prev.filter((j) => j.id !== oldJob.id);
        default:
          return prev;
      }
    });
  };

  /* ---------------- Add / Update Job ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const updatedJob = {
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          requirements: form.requirements.trim(),
          location: form.location.trim(),
          company_name: form.company_name.trim(),
          salary_range: form.salary_range.trim(),
          updated_at: new Date().toISOString(),
        };
        setJobs((prev) =>
          prev.map((j) => (j.id === form.id ? updatedJob : j))
        );
        const { error } = await supabase
          .from("jobs")
          .update(updatedJob)
          .eq("id", form.id)
          .eq("recruiter_id", user.id);
        if (error) throw error;
        toast("✅ Job updated successfully!", "success");
      } else {
        const { data, error } = await supabase
          .from("jobs")
          .insert([
            {
              recruiter_id: user.id,
              title: form.title.trim(),
              description: form.description.trim(),
              requirements: form.requirements.trim(),
              location: form.location.trim(),
              company_name: form.company_name.trim(),
              salary_range: form.salary_range.trim(),
              status: form.status,
            },
          ])
          .select()
          .single();
        if (error) throw error;
        setJobs((prev) => [data, ...prev]);
        toast("🎉 Job posted successfully!", "success");
      }
      closePanel();
    } catch (err) {
      console.error("Save job error:", err);
      toast("Unable to save job.", "error");
    }
  };

  /* ---------------- Delete Job ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    setJobs((prev) => prev.filter((j) => j.id !== id));
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) {
      toast("Failed to delete job.", "error");
      console.error(error);
    } else toast("🗑️ Job deleted successfully!", "success");
  };

  /* ---------------- UI Controls ---------------- */
  const openPanel = (job = null) => {
    if (job) {
      setForm(job);
      setIsEditing(true);
    } else {
      resetForm();
      setIsEditing(false);
    }
    setIsPanelOpen(true);
    setTimeout(() => panelRef.current?.scrollTo(0, 0), 150);
    document.body.style.overflow = "hidden";
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    document.body.style.overflow = "";
    resetForm();
  };

  const resetForm = () =>
    setForm({
      id: null,
      title: "",
      description: "",
      requirements: "",
      location: "",
      company_name: "",
      salary_range: "",
      status: "Open",
    });

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      : "—";

  /* ---------------- Render ---------------- */
  if (loading)
    return (
      <div className="text-center py-12 text-gray-500 animate-pulse">
        Loading job postings...
      </div>
    );

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Job Postings
        </h1>
        <button
          onClick={() => openPanel()}
          className="flex items-center gap-2 bg-sky-600 text-white px-5 py-2 rounded-xl hover:bg-sky-700 shadow transition"
        >
          <Plus size={18} /> New Job
        </button>
      </div>

      {/* Job Cards */}
      {jobs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl text-gray-500 bg-gray-50">
          <p className="text-lg font-medium mb-1">No job postings yet</p>
          <p className="text-sm">Click “New Job” to create your first listing</p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  {job.title}
                </h2>
                <p className="text-gray-600 text-sm font-serif line-clamp-3 mb-3">
                  Requirements : {job.requirements}
                </p>
                <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                  {job.description}
                </p>


                <div className="space-y-1 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Building2 size={14} /> {job.company_name || "—"}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={14} /> {job.location || "Not specified"}
                  </p>
                  <p className="flex items-center gap-2">
                    <DollarSign size={14} /> {job.salary_range || "—"}
                  </p>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-sky-600" />
                    {job.applicant_count ?? 0} applicants
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} /> {formatDate(job.updated_at)}
                  </div>
                </div>

                <div className="mt-5 flex justify-between gap-3 border-t pt-3">
                  <p className="font-semibold font-serif">
                      {job.status}
                    </p>
                    <div className="flex gap-4">
                      <button
                    onClick={() => openPanel(job)}
                    className="text-sky-600 hover:text-sky-700 flex items-center gap-1 text-sm font-medium"
                  >
                    <Edit3 size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm font-medium"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                    </div>
                  
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ---------------- Animated Side Panel ---------------- */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black backdrop-blur-sm z-40"
              onClick={closePanel}
            />

            {/* Sliding Panel */}
            <motion.div
              key="panel"
              ref={panelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 border-b pb-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  {isEditing ? "Edit Job Posting" : "Add New Job"}
                </h2>
                <button
                  onClick={closePanel}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Job Title
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                {/* Requirements */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Requirements
                  </label>
                  <textarea
                    rows="2"
                    value={form.requirements}
                    onChange={(e) =>
                      setForm({ ...form, requirements: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                {/* Location & Company */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={form.company_name}
                      onChange={(e) =>
                        setForm({ ...form, company_name: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Salary & Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    value={form.salary_range}
                    onChange={(e) =>
                      setForm({ ...form, salary_range: e.target.value })
                    }
                    placeholder="e.g. $50,000 - $70,000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option>Open</option>
                    <option>Closed</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={closePanel}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 shadow transition"
                  >
                    {isEditing ? "Update Job" : "Post Job"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
