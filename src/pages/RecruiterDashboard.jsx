import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Upload, Trash2, X, Plus, Users, ClipboardList } from "lucide-react";
import SidebarRecruiter from "../components/SidebarRecruiter";
import RecruiterSettings from "../components/RecruiterSettings";



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
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);

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
            recruiter?.full_name ||
            metadata.full_name ||
            metadata.name ||
            "",
          email: recruiter?.email || currentUser.email || "",
          phone:
            recruiter?.phone ||
            metadata.phone ||
            metadata.phone_number ||
            "",
          position: recruiter?.position || metadata.position || "",
        };

        setProfile(mergedProfile);
        setAvatarUrl(recruiter?.avatar_url || metadata.avatar_url || null);

        // ✅ Auto-create recruiter record if missing
        if (!recruiter) {
          await supabase.from("recruiters").insert({
            user_id: currentUser.id,
            ...mergedProfile,
            avatar_url: mergedProfile.avatar_url || null,
          });
        } else {
          // ✅ Sync recruiter table if metadata changed
          const hasDiff =
            recruiter.full_name !== mergedProfile.full_name ||
            recruiter.phone !== mergedProfile.phone ||
            recruiter.company_name !== mergedProfile.company_name ||
            recruiter.position !== mergedProfile.position;

          if (hasDiff) {
            await supabase
              .from("recruiters")
              .update({
                full_name: mergedProfile.full_name,
                phone: mergedProfile.phone,
                company_name: mergedProfile.company_name,
                position: mergedProfile.position,
              })
              .eq("user_id", currentUser.id);
          }
        }
      } catch (err) {
        console.error("Fetch recruiter error:", err);
        toast("Unable to load recruiter profile.", "error");
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


  /* ---------------- Save recruiter profile ---------------- */
  const handleSave = async () => {
    if (!user) return toast("No user found", "error");

    setSaving(true);
    try {
      // 1️⃣ Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          phone: profile.phone,
          company_name: profile.company_name,
          position: profile.position,
        },
      });

      if (authError) throw authError;

      // 2️⃣ Update recruiter table
      const { error: recruiterError } = await supabase
        .from("recruiters")
        .upsert(
          {
            user_id: user.id,
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            company_name: profile.company_name,
            position: profile.position,
            avatar_url: avatarUrl,
          },
          { onConflict: "user_id" }
        );

      if (recruiterError) throw recruiterError;

      toast("Profile updated successfully!", "success");
    } catch (err) {
      console.error("Save error:", err);
      toast("Failed to save profile.", "error");
    } finally {
      setSaving(false);
    }
  };


  /* ---------------- Avatar upload/remove ---------------- */
  const handleAvatarUpload = async () => {
    if (!avatarFile) return toast("Please select an image first.", "info");
    if (!user) return toast("User not found.", "error");

    if (!avatarFile.type.startsWith("image/"))
      return toast("Please upload a valid image file.", "error");
    if (avatarFile.size > 2 * 1024 * 1024)
      return toast("Image must be smaller than 2MB.", "warning");

    setUploadingAvatar(true);
    try {
      const ext = avatarFile.name.split(".").pop();
      const filename = `${user.id}.${ext}`;
      const path = `avatars/${filename}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

      setAvatarUrl(publicUrl);

      // ✅ Update both tables
      const updates = [
        supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id),
        supabase.from("recruiters").update({ avatar_url: publicUrl }).eq("user_id", user.id)
      ];
      const [{ error: profileError }, { error: candidateError }] = await Promise.all(updates);

      if (profileError) throw profileError;
      if (candidateError) throw candidateError;

      toast("Profile photo updated!", "success");
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast(err.message || "Failed to upload profile photo.", "error");
    } finally {
      setUploadingAvatar(false);
      setAvatarFile(null);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return;
    if (!window.confirm("Remove your profile photo?")) return;

    try {
      // Extract storage path from the public URL
      const path = decodeURIComponent(avatarUrl.split("/avatars/")[1].split("?")[0]);

      // Remove from Supabase storage
      const { error: storageError } = await supabase.storage
        .from("avatars")
        .remove([path]);
      if (storageError) throw storageError;

      // Clear avatar_url in both tables (profiles + candidates)
      const [{ error: profileError }, { error: candidateError }] = await Promise.all([
        supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id),
        supabase.from("recruiters").update({ avatar_url: null }).eq("user_id", user.id),
      ]);

      if (profileError) throw profileError;
      if (candidateError) throw candidateError;

      // Update local state
      setAvatarUrl(null);

      toast("Profile photo removed.", "warning");
    } catch (err) {
      console.error("Remove avatar error:", err);
      toast(err.message || "Failed to remove profile photo.", "error");
    }
  };

  /* ---------------- Logout ---------------- */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch { }
    navigate("/auth");
  };

  const firstName = profile.full_name?.split(" ")[0] || "Recruiter";
  const mainMarginLeft = sidebarOpen ? (sidebarCollapsed ? 72 : 256) : 0;

  return (
    <div className="min-h-screen flex bg-slate-50 text-gray-800 pt-20">
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
        <div className="max-w-6xl mx-auto px-3 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-slate-50"
          >
            <Menu size={18} />
          </button>
          <div className="text-sm font-semibold text-sky-700">Recruiter Portal</div>
          <div className="text-sm text-gray-700">Hi, {firstName}</div>
        </div>
      </header>

      {/* Main Content */}
      <div
        ref={mainRef}
        className="flex-1 min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: mainMarginLeft }}
      >
        <main className="max-w-6xl mx-auto px-4 pt-20 lg:pt-6 pb-12">
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold mb-2">Welcome, {firstName}</h1>
              <p className="text-gray-600">Manage job postings and applicants below.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Active Job Posts" value="5" />
                <StatCard title="Total Applicants" value="27" />
                <StatCard title="Interviews Scheduled" value="4" />
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Applicants</h2>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between border-b pb-2">
                    <span>Jane Doe</span>
                    <span className="text-gray-500">Frontend Developer</span>
                  </li>
                  <li className="flex justify-between border-b pb-2">
                    <span>Michael Brown</span>
                    <span className="text-gray-500">UI/UX Designer</span>
                  </li>
                  <li className="flex justify-between border-b pb-2">
                    <span>Emily Davis</span>
                    <span className="text-gray-500">Backend Engineer</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Manage Jobs */}
          {activeTab === "jobs" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Job Postings</h1>
                <button className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700">
                  <Plus size={18} /> New Job
                </button>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b text-gray-600">
                    <tr>
                      <th className="text-left py-3 px-4">Title</th>
                      <th className="text-left py-3 px-4">Applicants</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { title: "Frontend Developer", applicants: 12, status: "Open" },
                      { title: "Product Manager", applicants: 6, status: "Closed" },
                    ].map((job, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 px-4 font-medium">{job.title}</td>
                        <td className="py-3 px-4">{job.applicants}</td>
                        <td className="py-3 px-4">{job.status}</td>
                        <td className="py-3 px-4 text-right">
                          <button className="text-sky-600 hover:underline">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <RecruiterSettings
              user={user}
              profile={profile}
              onLogout={handleLogout}
              toast={toast}
            />
          )}

          {/* Profile */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold mb-4">Recruiter Profile</h1>

              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <img
                    src={avatarUrl || "https://via.placeholder.com/120?text=Profile"}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border border-gray-300 shadow-sm"
                  />
                  {avatarUrl && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                      title="Remove photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-col items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files[0])}
                    className="text-sm text-gray-600"
                  />
                  <button
                    onClick={handleAvatarUpload}
                    disabled={uploadingAvatar || !avatarFile}
                    className={`mt-2 px-4 py-1.5 rounded-lg text-white text-sm flex items-center gap-2 ${uploadingAvatar || !avatarFile
                      ? "bg-sky-400 cursor-not-allowed"
                      : "bg-sky-600 hover:bg-sky-700"
                      }`}
                  >
                    {uploadingAvatar ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        {avatarUrl ? "Change Photo" : "Upload Photo"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput
                  label="Full Name"
                  value={profile.full_name}
                  onChange={(v) => setProfile((p) => ({ ...p, full_name: v }))}
                />
                <TextInput label="Email" value={profile.email} disabled />
                <TextInput
                  label="Phone"
                  value={profile.phone}
                  onChange={(v) => setProfile((p) => ({ ...p, phone: v }))}
                />
                <TextInput
                  label="Company Name"
                  value={profile.company_name}
                  onChange={(v) => setProfile((p) => ({ ...p, company_name: v }))}
                />
                <TextInput
                  label="Position / Title"
                  value={profile.position}
                  onChange={(v) => setProfile((p) => ({ ...p, position: v }))}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white transition ${saving
                  ? "bg-sky-400 cursor-not-allowed"
                  : "bg-sky-600 hover:bg-sky-700"
                  }`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------------------- Helper Components ---------------------- */
function StatCard({ title, value }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function TextInput({ label, value, onChange, disabled = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
          }`}
      />
    </div>
  );
}
