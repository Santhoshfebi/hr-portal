import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Plus, Edit3, Trash2, Users, Clock } from "lucide-react";

export default function JobPostings({ user, toast }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    id: null,
    title: "",
    description: "",
    status: "Open",
  });

  /* ---------------- Fetch Recruiter Jobs ---------------- */
  useEffect(() => {
    if (!user) return;
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, description, status, created_at, updated_at, applicant_count")
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

  /* ---------------- Add / Update Job ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const { error } = await supabase
          .from("jobs")
          .update({
            title: form.title,
            description: form.description,
            status: form.status,
          })
          .eq("id", form.id)
          .eq("recruiter_id", user.id);

        if (error) throw error;
        toast("Job updated successfully!", "success");
      } else {
        const { error } = await supabase.from("jobs").insert([
          {
            recruiter_id: user.id,
            title: form.title,
            description: form.description,
            status: form.status,
          },
        ]);
        if (error) throw error;
        toast("Job added successfully!", "success");
      }

      setForm({ id: null, title: "", description: "", status: "Open" });
      setShowForm(false);
      setIsEditing(false);
      fetchJobs();
    } catch (err) {
      console.error("Save job error:", err);
      toast("Unable to save job.", "error");
    }
  };

  /* ---------------- Delete Job ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
      toast("Job deleted.", "success");
      fetchJobs();
    } catch (err) {
      console.error("Delete job error:", err);
      toast("Failed to delete job.", "error");
    }
  };

  /* ---------------- Open Edit Modal ---------------- */
  const handleEdit = (job) => {
    setForm({
      id: job.id,
      title: job.title,
      description: job.description,
      status: job.status,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  /* ---------------- Helper: Format Date ---------------- */
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* ---------------- Render ---------------- */
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 animate-pulse">
        Loading job postings...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Job Postings</h1>
        <button
          onClick={() => {
            setForm({ id: null, title: "", description: "", status: "Open" });
            setIsEditing(false);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition"
        >
          <Plus size={18} /> New Job
        </button>
      </div>

      {/* Job List */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-xl">
            No job postings found.
          </div>
        )}

        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                {job.title}
              </h2>
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                {job.description}
              </p>
              <p
                className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${
                  job.status === "Open"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {job.status}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-sky-600" />
                {job.applicant_count || 0} applicants
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                {formatDate(job.updated_at)}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => handleEdit(job)}
                className="text-sky-600 hover:underline font-medium text-sm"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => handleDelete(job.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form (for Add/Edit) */}
      {showForm && (
        <div className="fixed inset-0 bg-amber-200 bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? "Edit Job" : "Add New Job"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Job Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Description</label>
                <textarea
                  rows="4"
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option>Open</option>
                  <option>Closed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
                >
                  {isEditing ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
