import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import {
  User,
  Briefcase,
  Calendar,
  MapPin,
  Building2,
  Clock,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ViewApplicants({ user, toast }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Filters
  const [selectedJob, setSelectedJob] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");

  // Pagination
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) fetchApplications();
  }, [user]);

  /** ---------------- Fetch Applications ---------------- */
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          cover_letter,
          scheduled_at,
          created_at,
          candidate:candidates(full_name, email),
          job:jobs(id, title, location, company_name, recruiter_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const filtered = (data || []).filter(
        (a) => a.job?.recruiter_id === user.id
      );
      setApplications(filtered);
    } catch (err) {
      console.error("Fetch applications error:", err);
      toast("Unable to load applicants.", "error");
    } finally {
      setLoading(false);
    }
  };

  /** ---------------- Handle Status Change ---------------- */
  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      const updateData =
        newStatus === "Rejected" || newStatus === "Hired"
          ? { status: newStatus, scheduled_at: null }
          : { status: newStatus };

      const { error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", appId);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, ...updateData } : app
        )
      );

      if (newStatus === "Interview") {
        const app = applications.find((a) => a.id === appId);
        setSelectedApp(app);
        setSelectedDate(app?.scheduled_at || "");
        setShowModal(true);
      }

      toast(`Applicant marked as ${newStatus}`, "success");
    } catch (err) {
      console.error("Status update error:", err);
      toast("Failed to update status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  /** ---------------- Schedule Interview ---------------- */
  const handleInterviewSchedule = async () => {
    if (!selectedApp || !selectedDate) return;
    setUpdatingId(selectedApp.id);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ scheduled_at: selectedDate })
        .eq("id", selectedApp.id);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApp.id
            ? { ...app, scheduled_at: selectedDate }
            : app
        )
      );

      toast("📅 Interview scheduled successfully!", "success");
      setShowModal(false);
    } catch (err) {
      console.error("Interview scheduling error:", err);
      toast("Failed to schedule interview.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  /** ---------------- Helpers ---------------- */
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const uniqueJobTitles = useMemo(() => {
    const titles = applications.map((a) => a.job?.title).filter(Boolean);
    return ["All", ...new Set(titles)];
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((a) => {
      const matchesJob =
        selectedJob === "All" || a.job?.title === selectedJob;
      const matchesStatus =
        selectedStatus === "All" || a.status === selectedStatus;
      return matchesJob && matchesStatus;
    });
  }, [applications, selectedJob, selectedStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedData = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const nextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () =>
    setCurrentPage((p) => Math.max(p - 1, 1));

  /** ---------------- Loading ---------------- */
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 animate-pulse">
        Loading applicants...
      </div>
    );
  }

  /** ---------------- Main UI ---------------- */
  return (
    <>
      <div className="space-y-8">
        {/* Header + Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            Applicants
          </h1>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Job Filter */}
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-600">Job:</p>
              <div className="relative">
                <Filter
                  size={15}
                  className="absolute left-3 top-2.5 text-gray-400"
                />
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-400"
                >
                  {uniqueJobTitles.map((title) => (
                    <option key={title}>{title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-600">Status:</p>
              <div className="relative">
                <Filter
                  size={15}
                  className="absolute left-3 top-2.5 text-gray-400"
                />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-400"
                >
                  {["All", "Pending", "Interview", "Hired", "Rejected", "Withdrawn"].map(
                    (status) => (
                      <option key={status}>{status}</option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {paginatedData.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No applicants found for the selected filters.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b text-gray-600">
                    <tr>
                      <th className="text-left py-3 px-4">Candidate</th>
                      <th className="text-left py-3 px-4">Job Title</th>
                      <th className="text-left py-3 px-4">Company</th>
                      <th className="text-left py-3 px-4">Location</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Applied On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((app) => (
                      <tr
                        key={app.id}
                        className="border-b last:border-0 hover:bg-gray-50 transition"
                      >
                        <td className="py-3 px-4 font-medium text-gray-800">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-sky-600" />
                            <div>
                              <div>{app.candidate?.full_name || "Unknown"}</div>
                              <div className="text-gray-500 text-xs">
                                {app.candidate?.email || "No email"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Briefcase size={15} className="text-gray-500" />
                            {app.job?.title || "Untitled"}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-gray-700">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-gray-400" />
                            {app.job?.company_name || "—"}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-gray-700">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-400" />
                            {app.job?.location || "—"}
                          </div>
                        </td>

                        <td className="py-3 px-4 space-y-2">
                          <select
                            value={app.status || "Pending"}
                            disabled={updatingId === app.id}
                            onChange={(e) =>
                              handleStatusChange(app.id, e.target.value)
                            }
                            className={`px-2 py-1 text-xs rounded-md border ${
                              app.status === "Pending"
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : app.status === "Interview"
                                ? "bg-sky-50 border-sky-200 text-sky-700"
                                : app.status === "Hired"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : app.status === "Rejected"
                                ? "bg-red-50 border-red-200 text-red-700"
                                : "bg-gray-50 border-gray-200 text-gray-700"
                            } focus:ring-2 focus:ring-sky-400`}
                          >
                            <option>Pending</option>
                            <option>Interview</option>
                            <option>Hired</option>
                            <option>Rejected</option>
                            <option>Withdrawn</option>
                          </select>

                          {app.status === "Interview" && app.scheduled_at && (
                            <div className="inline-flex items-center mt-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-full">
                              <Clock size={12} className="mr-1" />
                              {new Date(app.scheduled_at).toLocaleString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Calendar size={14} /> {formatDate(app.created_at)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {paginatedData.map((app) => (
                  <div key={app.id} className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-800">
                        {app.candidate?.full_name || "Unknown"}
                      </h3>
                      <select
                        value={app.status || "Pending"}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value)
                        }
                        className="text-xs border border-gray-300 rounded-md px-2 py-1"
                      >
                        <option>Pending</option>
                        <option>Interview</option>
                        <option>Hired</option>
                        <option>Rejected</option>
                        <option>Withdrawn</option>
                      </select>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      {app.candidate?.email}
                    </p>
                    <p className="text-sm text-gray-700">
                      {app.job?.title} — {app.job?.company_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <MapPin size={12} className="inline mr-1" />
                      {app.job?.location || "—"}
                    </p>

                    {app.status === "Interview" && app.scheduled_at && (
                      <p className="mt-2 text-xs text-emerald-700 flex items-center gap-1">
                        <Clock size={12} />{" "}
                        {new Date(app.scheduled_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------------- Interview Modal ---------------- */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowModal(false)}
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Schedule Interview
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {selectedApp.candidate?.full_name} —{" "}
              <span className="font-medium">{selectedApp.job?.title}</span>
            </p>

            <input
              type="datetime-local"
              value={
                selectedDate
                  ? new Date(selectedDate).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400"
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInterviewSchedule}
                disabled={!selectedDate || updatingId === selectedApp.id}
                className="px-4 py-2 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
              >
                Save Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
