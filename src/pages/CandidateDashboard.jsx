import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import CandidateProfile from "../components/CandidateProfile";
import CandidateResume from "../components/CandidateResume";
import CandidateSettings from "../components/CandidateSettings";
import BrowseJobs from "../components/BrowseJobs";
import { Menu } from "lucide-react";

function toast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className =
      "fixed bottom-6 right-6 flex flex-col gap-3 items-end z-[9999]";
    document.body.appendChild(container);
  }

  const colors = {
    success: "bg-emerald-600",
    error: "bg-red-600",
    info: "bg-sky-600",
    warning: "bg-amber-500 text-black",
  };

  const el = document.createElement("div");
  el.textContent = message;
  el.className = `text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg animate-slide-up ${colors[type] || colors.info
    }`;
  container.prepend(el);

  setTimeout(() => {
    el.style.transition = "opacity 0.45s, transform 0.45s";
    el.style.opacity = "0";
    el.style.transform = "translateY(18px)";
    setTimeout(() => el.remove(), 450);
  }, 2400);
}

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    education: "",
    experience: "",
    skills: "",
    resume_url: "",
    avatar_url: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* ---------------- Fetch user + profile ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData?.user) return navigate("/auth", { replace: true });

        const user = authData.user;
        setUser(user);

        // ✅ Fetch all candidate fields, including resume_name
        const { data: candidate, error: candidateError } = await supabase
          .from("candidates")
          .select(
            "full_name, email, phone, education, experience, skills, resume_url, resume_name, avatar_url"
          )
          .eq("user_id", user.id)
          .single();

        if (candidateError) throw candidateError;

        if (candidate) {
          setFormData({
            full_name: candidate.full_name || "",
            email: candidate.email || user.email,
            phone: candidate.phone || "",
            education: candidate.education || "",
            experience: candidate.experience || "",
            skills: candidate.skills || "",
            resume_url: candidate.resume_url || "",
            resume_name: candidate.resume_name || "",
            avatar_url: candidate.avatar_url || "",
          });
          setAvatarUrl(candidate.avatar_url || "");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        toast("Session expired, please log in again.", "error");
        navigate("/auth", { replace: true });
      }
    };
    fetchData();
  }, [navigate]);

  /* ✅ Listen to realtime avatar updates */
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("candidate-avatar-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "candidates", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newUrl = payload.new.avatar_url;
          if (newUrl) {
            setAvatarUrl(newUrl);
            setFormData((prev) => ({ ...prev, avatar_url: newUrl }));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const firstName = formData.full_name?.split(" ")[0] || "User";
  const mainMarginLeft = sidebarOpen ? (sidebarCollapsed ? 72 : 256) : 0;

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 text-gray-600">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-gray-800 pt-20">
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        userInfo={{
          name: formData.full_name,
          email: formData.email,
          avatarUrl: avatarUrl,
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleCollapse={() => setSidebarCollapsed((s) => !s)}
        onCloseMobile={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        toast={toast}
      />

      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 lg:hidden">
        <div className="max-w-6xl mx-auto px-3 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-slate-50"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="text-sm font-semibold text-sky-700">
              Candidate Portal
            </div>
          </div>
          <div className="text-sm text-gray-700">Hi, {firstName}</div>
        </div>
      </header>

      <main
        className="flex-1 min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: mainMarginLeft }}
      >
        <div className="max-w-5xl mx-auto px-4 pt-20 lg:pt-6 pb-12 space-y-8">
          {activeTab === "overview" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
                <div>
                  <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                    Welcome back, {firstName} 👋
                  </h1>
                  <p className="text-gray-600">
                    Here’s your personalized dashboard summary — manage your career profile efficiently.
                  </p>
                </div>

                {formData.avatar_url && (
                  <img
                    src={formData.avatar_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full border border-gray-200 object-cover shadow-sm mt-4 md:mt-0"
                  />
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <DashboardStat
                  title="Profile Completion"
                  value={`${Math.min(
                    [
                      formData.full_name,
                      formData.phone,
                      formData.education,
                      formData.experience,
                      formData.skills,
                    ].filter(Boolean).length * 20,
                    100
                  )}%`}
                  description="Complete your profile for better visibility."
                />
                <DashboardStat
                  title="Resume Status"
                  value={formData.resume_url ? "Uploaded" : "Not Uploaded"}
                  description={
                    formData.resume_url
                      ? "Your resume is available for recruiters."
                      : "Upload your resume to start applying."
                  }
                  color={formData.resume_url ? "text-emerald-600" : "text-amber-600"}
                />
                <DashboardStat
                  title="Account Email"
                  value={formData.email}
                  description="Primary email associated with your account."
                />
              </div>

              {/* Profile Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-1">
                    Personal Information
                  </h2>
                  <InfoRow label="Full Name" value={formData.full_name || "Not provided"} />
                  <InfoRow label="Email" value={formData.email} />
                  <InfoRow label="Phone" value={formData.phone || "Not provided"} />
                </div>

                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-1">
                    Professional Information
                  </h2>
                  <InfoRow label="Education" value={formData.education || "Not provided"} />
                  <InfoRow label="Experience" value={formData.experience || "Not provided"} />
                  <InfoRow label="Skills" value={formData.skills || "Not provided"} />
                </div>
              </div>

              {/* Resume Section */}
              <div className="mt-10 border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Resume</h2>
                <div>
                  {formData.resume_name || "Resume"}
                </div>
                {formData.resume_url ? (
                  <a
                    href={formData.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-5 py-2.5 rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition font-medium shadow-sm"
                  >
                    View Current Resume
                  </a>
                ) : (
                  <p className="text-gray-500 italic">
                    You haven’t uploaded a resume yet. Go to the “Resume” tab to upload.
                  </p>
                )}
              </div>
            </div>
          )}


          {activeTab === "profile" && (
            <CandidateProfile
              user={user}
              formData={formData}
              setFormData={setFormData}
              avatarUrl={avatarUrl}
              setAvatarUrl={setAvatarUrl} // ✅ passes setter
              toast={toast}
            />
          )}

          {activeTab === "browse" && (
            <BrowseJobs user={user} toast={toast} />
          )}

          {activeTab === "resume" && (
            <CandidateResume
              user={user}
              formData={formData}
              setFormData={setFormData}
              toast={toast}
            />
          )}

          {activeTab === "settings" && (
            <CandidateSettings
              user={user}
              profile={{
                full_name: formData.full_name,
                email: formData.email,
              }}
              onLogout={handleLogout}
              toast={toast}
            />
          )}
        </div>
      </main>
    </div>
  );
}


function DashboardStat({ title, value, description, color = "text-sky-600" }) {
  return (
    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-sm transition-all">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start text-sm">
      <span className="w-32 font-medium text-gray-500">{label}:</span>
      <span className="text-gray-800 flex-1 wrap-break-word">{value}</span>
    </div>
  );
}
