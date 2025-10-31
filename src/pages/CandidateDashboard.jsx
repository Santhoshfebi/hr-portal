import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Upload, Trash2, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import MobileSidebarToggle from "../components/MobileSidebarToggle";

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
  el.className = `text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg animate-slide-up ${
    colors[type] || colors.info
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

/* ---------------------- Candidate Dashboard ---------------------- */
export default function CandidateDashboard() {
  const navigate = useNavigate();
  const mainRef = useRef(null);

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    education: "",
    experience: "",
    skills: "",
  });

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [resumeFileName, setResumeFileName] = useState("");

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ---------------- Fetch user and profile ---------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData?.user) {
          navigate("/auth", { replace: true });
          return;
        }

        const currentUser = authData.user;
        setUser(currentUser);
        const metadata = currentUser.user_metadata || {};

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name,email,phone,resume_url,avatar_url")
          .eq("id", currentUser.id)
          .single();

        setAvatarUrl(profile?.avatar_url || null);

        const { data: candidate } = await supabase
          .from("candidates")
          .select("*")
          .eq("user_id", currentUser.id)
          .single();

        setFormData({
          full_name:
            profile?.full_name ||
            metadata.full_name ||
            metadata.name ||
            currentUser.email?.split("@")[0] ||
            "",
          email: profile?.email || currentUser.email || "",
          phone: profile?.phone || metadata.phone || candidate?.phone || "",
          education: candidate?.education || "",
          experience: candidate?.experience || "",
          skills: candidate?.skills || "",
        });

        setResumeUrl(candidate?.resume_url || profile?.resume_url || null);
        setResumeFileName(candidate?.resume_name || "");
      } catch (err) {
        console.error("Fetch profile error:", err);
        toast("Unable to fetch profile. Please sign in again.", "error");
        navigate("/auth", { replace: true });
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

  /* ---------------- Save profile ---------------- */
  const handleSaveProfile = async () => {
    try {
      if (!user) {
        toast("User not found. Please sign in again.", "error");
        navigate("/auth", { replace: true });
        return;
      }

      setSaving(true);

      // Update "profiles"
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          resume_url: resumeUrl,
        });

      if (profileError) throw profileError;

      // Update "candidates"
      const { error: candidateError } = await supabase
        .from("candidates")
        .upsert(
          {
            user_id: user.id,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            education: formData.education,
            experience: formData.experience,
            skills: formData.skills,
            resume_url: resumeUrl,
          },
          { onConflict: "user_id" }
        );

      if (candidateError) throw candidateError;

      // Sync auth metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
        },
      });

      if (metadataError) throw metadataError;

      toast("Profile updated successfully!", "success");
    } catch (err) {
      console.error("Save profile error:", err);
      toast("Failed to update profile. Please try again.", "error");
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
      supabase.from("candidates").update({ avatar_url: publicUrl }).eq("user_id", user.id)
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
      supabase.from("candidates").update({ avatar_url: null }).eq("user_id", user.id),
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

  /* ---------------- Resume upload/remove ---------------- */
  const handleResumeUpload = async () => {
    if (!resumeFile) return toast("Please select a resume file first.", "info");
    if (
      ![
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(resumeFile.type)
    )
      return toast("Please upload a PDF or Word document.", "error");
    if (resumeFile.size > 5 * 1024 * 1024)
      return toast("File size must be under 5MB.", "warning");

    setLoading(true);
    try {
      const ext = resumeFile.name.split(".").pop();
      const filename = `${user.id}.${ext}`;
      const path = `resumes/${filename}`;

      const { error: uploadErr } = await supabase.storage
        .from("resumes")
        .upload(path, resumeFile, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: publicData } = supabase.storage
        .from("resumes")
        .getPublicUrl(path);
      const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

      setResumeUrl(publicUrl);
      setResumeFileName(resumeFile.name);

      await supabase
        .from("candidates")
        .update({ resume_url: publicUrl, resume_name: resumeFile.name })
        .eq("user_id", user.id);
      await supabase
        .from("profiles")
        .update({ resume_url: publicUrl })
        .eq("id", user.id);

      toast("Resume uploaded successfully!", "success");
    } catch (err) {
      console.error("Upload error:", err);
      toast(err.message || "Failed to upload resume", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveResume = async () => {
    if (!resumeUrl) return;
    if (!window.confirm("Are you sure you want to remove your resume?")) return;
    setLoading(true);
    try {
      const path = decodeURIComponent(resumeUrl.split("/resumes/")[1].split("?")[0]);
      const { error: delErr } = await supabase.storage
        .from("resumes")
        .remove([path]);
      if (delErr) throw delErr;

      await supabase
        .from("candidates")
        .update({ resume_url: null, resume_name: null })
        .eq("user_id", user.id);
      await supabase
        .from("profiles")
        .update({ resume_url: null })
        .eq("id", user.id);

      setResumeUrl(null);
      setResumeFileName("");
      toast("Resume removed", "warning");
    } catch (err) {
      console.error("Remove resume error:", err);
      toast(err.message || "Failed to remove resume", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Logout ---------------- */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    navigate("/auth");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  const firstName = formData.full_name?.split(" ")[0] || "User";
  const mainMarginLeft = sidebarOpen ? (sidebarCollapsed ? 72 : 256) : 0;

  return (
    <div className="min-h-screen flex bg-slate-50 text-gray-800 pt-20">
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        userInfo={{
          name: formData.full_name,
          email: formData.email,
          avatar: avatarUrl || "https://via.placeholder.com/64?text=User",
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleCollapse={() => setSidebarCollapsed((s) => !s)}
        onCloseMobile={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        toast={toast}
      />
{/* Mobile Header */}
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
                            <div>
                                <h1 className="text-2xl font-bold mb-2">Welcome, {firstName}</h1>
                                <p className="text-gray-600">
                                    Here’s an overview of your profile and current application status.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <StatCard title="Applications Submitted" value="3" />
                                <StatCard title="Interviews Scheduled" value="1" />
                                <StatCard title="Profile Completion" value="85%" />
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                    Profile Summary
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Full Name</p>
                                        <p className="font-medium text-gray-900">{formData.full_name || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Email</p>
                                        <p className="font-medium text-gray-900">{formData.email || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Phone</p>
                                        <p className="font-medium text-gray-900">{formData.phone || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Education</p>
                                        <p className="font-medium text-gray-900">{formData.education || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Experience</p>
                                        <p className="font-medium text-gray-900">{formData.experience || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Skills</p>
                                        <p className="font-medium text-gray-900">{formData.skills || "—"}</p>
                                    </div>
                                </div>

                                {resumeUrl && (
                                    <div className="mt-6">
                                        <p className="text-gray-500 mb-1">Resume</p>
                                        <button
                                            onClick={() => setShowResumePreview(true)}
                                            className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"
                                        >
                                            View Resume
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Profile */}
                    {activeTab === "profile" && (
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold mb-4">Profile Information</h1>

                            {/* Profile Image Section */}
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
                                    value={formData.full_name}
                                    onChange={(value) => setFormData((p) => ({ ...p, full_name: value }))}
                                />
                                <TextInput label="Email" value={formData.email} disabled />
                                <TextInput
                                    label="Phone"
                                    value={formData.phone}
                                    onChange={(value) => setFormData((p) => ({ ...p, phone: value }))}
                                />
                                <TextInput
                                    label="Education"
                                    value={formData.education}
                                    onChange={(value) => setFormData((p) => ({ ...p, education: value }))}
                                />
                                <TextInput
                                    label="Experience"
                                    value={formData.experience}
                                    onChange={(value) => setFormData((p) => ({ ...p, experience: value }))}
                                />
                                <TextInput
                                    label="Skills"
                                    value={formData.skills}
                                    onChange={(value) => setFormData((p) => ({ ...p, skills: value }))}
                                />
                            </div>

                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white transition ${saving ? "bg-sky-400 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-700"
                                    }`}
                            >
                                {saving ? (
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
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    )}

                    {/* Resume */}
                    {activeTab === "resume" && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">Manage Resume</h2>
                            {!resumeUrl ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setResumeFile(e.target.files[0])}
                                        className="block mx-auto mb-3"
                                    />
                                    <button
                                        onClick={handleResumeUpload}
                                        disabled={loading}
                                        className="flex items-center gap-2 mx-auto bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 disabled:opacity-50"
                                    >
                                        <Upload size={18} />
                                        Upload Resume
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                                    <p className="text-gray-600 mb-3">
                                        Current file:{" "}
                                        <span className="font-medium text-gray-800">{resumeFileName}</span>
                                    </p>
                                    <div className="flex gap-3">
                                        <a
                                            href={resumeUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"
                                        >
                                            View Resume
                                        </a>
                                        <button
                                            onClick={handleRemoveResume}
                                            disabled={loading}
                                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                        >
                                            <Trash2 size={18} /> Remove
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Resume Preview Modal */}
            <AnimatePresence>
                {showResumePreview && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-60 z-9998 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl overflow-hidden w-full max-w-4xl h-[90vh] flex flex-col"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                        >
                            <div className="flex justify-between items-center p-3 bg-gray-100 border-b">
                                <h3 className="text-sm font-semibold text-gray-700">{resumeFileName}</h3>
                                <button
                                    onClick={() => setShowResumePreview(false)}
                                    className="p-2 rounded-lg hover:bg-gray-200"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <iframe src={resumeUrl} className="flex-1 w-full" title="Resume Preview" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none ${
          disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}
