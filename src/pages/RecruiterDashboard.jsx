import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Menu, Plus, LogOut } from "lucide-react";
import SidebarRecruiter from "../components/SidebarRecruiter";
import RecruiterSettings from "../components/RecruiterSettings";
import Candidates from "../pages/Candidates";
import RecruiterProfile from "../pages/RecruiterProfile";
import JobPostings from "../pages/JobPostings";
import ViewApplicants from "../pages/ViewApplicants";

/* ---------------------------- Toast util ---------------------------- */
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

if (!document.getElementById("toast-anim-style")) {
  const style = document.createElement("style");
  style.id = "toast-anim-style";
  style.textContent = `
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(18px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up { animation: slide-up 0.35s ease-out; }
  `;
  document.head.appendChild(style);
}

/* ---------------------- Recruiter Dashboard ---------------------- */
export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const mainRef = useRef(null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    company_name: "",
    full_name: "",
    email: "",
    phone: "",
    position: "",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ---------------- Fetch recruiter profile ---------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData?.user) return navigate("/auth", { replace: true });

        const currentUser = authData.user;
        setUser(currentUser);

        const { data: recruiter, error } = await supabase
          .from("recruiters")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (error) throw error;

        const metadata = currentUser.user_metadata || {};
        const mergedProfile = {
          company_name: recruiter?.company_name || metadata.company_name || "",
          full_name:
            recruiter?.full_name || metadata.full_name || metadata.name || "",
          email: recruiter?.email || currentUser.email || "",
          phone:
            recruiter?.phone || metadata.phone || metadata.phone_number || "",
          position: recruiter?.position || metadata.position || "",
        };

        setProfile(mergedProfile);
        setAvatarUrl(recruiter?.avatar_url || metadata.avatar_url || null);

        if (!recruiter) {
          await supabase.from("recruiters").insert({
            user_id: currentUser.id,
            ...mergedProfile,
            avatar_url: mergedProfile.avatar_url || null,
          });
        }
      } catch (err) {
        console.error("Fetch recruiter error:", err);
        toast("Unable to load recruiter profile.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const handleResize = () => {
      if (window.innerWidth < 900) {
        setSidebarOpen(false);
        setSidebarCollapsed(true);
      } else {
        setSidebarOpen(true);
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [navigate]);

  /* ---------------- Logout ---------------- */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const firstName = profile.full_name?.split(" ")[0] || "Recruiter";
  const mainMarginLeft = sidebarOpen ? (sidebarCollapsed ? 72 : 256) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-gray-600 text-sm animate-pulse">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-gray-800 pt-20">
      {/* Sidebar */}
      <SidebarRecruiter
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        userInfo={{
          name: profile.full_name,
          email: profile.email,
          avatar: avatarUrl || "https://via.placeholder.com/64?text=R",
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleCollapse={() => setSidebarCollapsed((s) => !s)}
        onCloseMobile={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 lg:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <div className="text-sm font-semibold text-sky-700">
            Recruiter Dashboard
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Hi, {firstName}</span>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-50 text-red-500 rounded-md"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div
        ref={mainRef}
        className="flex-1 min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: mainMarginLeft }}
      >
        <main className="max-w-6xl mx-auto px-4 pt-20 lg:pt-8 pb-12 space-y-8">
          {/* Overview */}
          {activeTab === "overview" && (
            <section>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}</h1>
              <p className="text-gray-600 mb-8">
                Here’s a quick overview of your recruitment activity.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Active Job Posts" value="5" />
                <StatCard title="Total Applicants" value="27" />
                <StatCard title="Interviews Scheduled" value="4" />
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Applicants
                </h2>
                <ul className="divide-y divide-gray-100 text-sm">
                  {[
                    { name: "Jane Doe", role: "Frontend Developer" },
                    { name: "Michael Brown", role: "UI/UX Designer" },
                    { name: "Emily Davis", role: "Backend Engineer" },
                  ].map((a, i) => (
                    <li key={i} className="flex justify-between py-2">
                      <span className="font-medium text-gray-700">{a.name}</span>
                      <span className="text-gray-500">{a.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Jobs */}
          {activeTab === "jobs" && <JobPostings user={user} toast={toast} />}
          {activeTab === "candidates" && <Candidates />}
          {activeTab === "applicants" && (
            <ViewApplicants user={user} toast={toast} />
          )}
          {activeTab === "profile" && (
            <RecruiterProfile
              user={user}
              profile={profile}
              setProfile={setProfile}
              avatarUrl={avatarUrl}
              setAvatarUrl={setAvatarUrl}
            />
          )}

          {/* Other Tabs */}
          {activeTab === "settings" && (
            <RecruiterSettings
              user={user}
              profile={profile}
              onLogout={handleLogout}
              toast={toast}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------------------- Helper Components ---------------------- */
function StatCard({ title, value }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
