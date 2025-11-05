import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { User, Briefcase, Calendar, MapPin, Building2 } from "lucide-react";

export default function ViewApplicants({ user, toast }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          cover_letter,
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

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", appId);

      if (error) throw error;

      // Update locally for snappy UI
      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: newStatus } : app
        )
      );

      toast(`Applicant marked as ${newStatus}`, "success");
    } catch (err) {
      console.error("Status update error:", err);
      toast("Failed to update status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 animate-pulse">
        Loading applicants...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Applicants</h1>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {applications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No applications found.
          </div>
        ) : (
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
              {applications.map((app) => (
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

                  <td className="py-3 px-4">
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
        )}
      </div>
    </div>
  );
}
