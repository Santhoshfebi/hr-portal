import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Trash2, X } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    education: "",
    experience: "",
    skills: "",
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [showResume, setShowResume] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch user + candidate profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        navigate("/auth", { replace: true });
        return;
      }

      const currentUser = authData.user;
      setUser(currentUser);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone, role, resume_url")
        .eq("id", currentUser.id)
        .single();

      setRole(profile?.role || "candidate");

      const { data: candidateData } = await supabase
        .from("candidates")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      const resumeUrlData =
        candidateData?.resume_url || profile?.resume_url || null;

      setFormData({
        full_name: profile?.full_name || "",
        email: profile?.email || currentUser.email,
        phone: profile?.phone || candidateData?.phone || "",
        education: candidateData?.education || "",
        experience: candidateData?.experience || "",
        skills: candidateData?.skills || "",
      });

      setResumeUrl(resumeUrlData);
      if (candidateData?.resume_name) {
        setResumeFileName(candidateData.resume_name);
      } else if (resumeUrlData) {
        const name = decodeURIComponent(resumeUrlData.split("/").pop());
        setResumeFileName(name);
      }
    };

    fetchProfile();
  }, [navigate]);

  // ✅ Save candidate info
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: candidateError } = await supabase.from("candidates").upsert(
        {
          user_id: user.id,
          ...formData,
          resume_url: resumeUrl,
          resume_name: resumeFileName,
        },
        { onConflict: "user_id" }
      );
      if (candidateError) throw candidateError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          resume_url: resumeUrl,
        })
        .eq("id", user.id);
      if (profileError) throw profileError;

      toast("✅ Profile updated successfully!", "success");
    } catch (error) {
      toast(`❌ ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Upload resume
  const handleResumeUpload = async () => {
    if (!resumeFile) return toast("Please select a resume file first.", "info");
    setLoading(true);

    try {
      const fileExt = resumeFile.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, resumeFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath);

      const newResumeUrl = `${publicData.publicUrl}?t=${Date.now()}`;
      setResumeUrl(newResumeUrl);
      setResumeFileName(resumeFile.name);

      await supabase
        .from("candidates")
        .update({ resume_url: newResumeUrl, resume_name: resumeFile.name })
        .eq("user_id", user.id);

      await supabase
        .from("profiles")
        .update({ resume_url: newResumeUrl })
        .eq("id", user.id);

      toast("✅ Resume uploaded successfully!", "success");
    } catch (error) {
      toast(`❌ ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Remove resume
  const handleRemoveResume = async () => {
    if (!resumeUrl) return;
    if (!window.confirm("Are you sure you want to remove your resume?")) return;
    setLoading(true);
    try {
      const path = decodeURIComponent(resumeUrl.split("/resumes/")[1].split("?")[0]);
      const { error: deleteError } = await supabase.storage
        .from("resumes")
        .remove([path]);
      if (deleteError) throw deleteError;

      await supabase
        .from("candidates")
        .update({ resume_url: null, resume_name: null })
        .eq("user_id", user.id);

      await supabase.from("profiles").update({ resume_url: null }).eq("id", user.id);

      setResumeUrl(null);
      setResumeFileName("");
      toast("🗑️ Resume removed successfully!", "warning");
    } catch (error) {
      toast(`❌ ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-10 border border-gray-100"
      >
        <h1 className="text-4xl font-extrabold text-blue-700 mb-2 text-center">
          {role === "recruiter" ? "Recruiter Dashboard" : "Candidate Dashboard"}
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Welcome back,{" "}
          <span className="font-semibold text-gray-900">
            {formData.full_name || "User"}
          </span>
          !
        </p>

        {/* Candidate Form */}
        {role === "candidate" ? (
          <>
            <form onSubmit={handleSave} className="space-y-5">
              {[
                ["Full Name", "full_name", false],
                ["Phone Number", "phone", true],
                ["Email", "email", true],
              ].map(([label, key, readOnly]) => (
                <div key={key}>
                  <label className="block text-gray-700 font-medium mb-2">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={formData[key]}
                    readOnly={readOnly}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    className={`border border-gray-300 w-full p-3 rounded-lg transition focus:ring-2 focus:ring-blue-500 ${
                      readOnly
                        ? "bg-gray-100 cursor-not-allowed"
                        : "focus:border-blue-400"
                    }`}
                  />
                </div>
              ))}

              {[
                ["Education", "education"],
                ["Experience", "experience"],
                ["Skills", "skills"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-gray-700 font-medium mb-2">
                    {label}
                  </label>
                  <textarea
                    value={formData[key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    rows="2"
                    className="border border-gray-300 w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg text-white font-semibold transition ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </form>

            {/* Resume Section */}
            <div className="mt-10 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="text-blue-600" /> Resume
              </h3>
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50 text-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  className="hidden"
                  id="resume-upload"
                />

                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                >
                  <Upload size={20} />
                  {resumeFile ? "Change File" : "Select File"}
                </label>

                {resumeFileName && (
                  <p className="mt-3 text-gray-700">
                    📎 <strong>{resumeFileName}</strong>
                  </p>
                )}

                <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleResumeUpload}
                    disabled={loading}
                    className={`flex-1 py-3 rounded-lg text-white font-semibold ${
                      loading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {loading ? "Uploading..." : "Upload Resume"}
                  </button>

                  {resumeUrl && (
                    <>
                      <button
                        onClick={() => setShowResume(true)}
                        className="flex-1 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                      >
                        📄 View Resume
                      </button>
                      <button
                        onClick={handleRemoveResume}
                        disabled={loading}
                        className="flex-1 py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
                      >
                        <Trash2 size={18} className="inline mr-1" /> Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          // Recruiter Section
          <motion.div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center shadow-inner">
            <h2 className="text-2xl font-semibold text-green-700 mb-3">
              Recruiter Tools
            </h2>
            <p className="text-gray-600 mb-4">
              View candidate applications, manage job postings, and contact applicants directly.
            </p>
            <button
              onClick={() => navigate("/candidates")}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              View Candidates
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Resume Modal */}
      <AnimatePresence>
        {showResume && resumeUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-3xl h-[90%] sm:w-[80%] sm:h-[80%] relative overflow-hidden"
            >
              <button
                onClick={() => setShowResume(false)}
                className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-red-600"
              >
                <X size={20} />
              </button>
              <iframe src={resumeUrl} title="Resume Preview" className="w-full h-full rounded-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ✅ Stacked Toast System
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
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
    warning: "bg-yellow-500 text-black",
  };

  const el = document.createElement("div");
  el.textContent = message;
  el.className = `
    text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg
    animate-slide-up ${colors[type] || colors.info}
  `;

  container.prepend(el);

  // Auto remove after delay
  setTimeout(() => {
    el.style.transition = "opacity 0.5s, transform 0.5s";
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    setTimeout(() => el.remove(), 500);
  }, 2500);
}

// Inject keyframes if missing
if (!document.getElementById("toast-anim-style")) {
  const style = document.createElement("style");
  style.id = "toast-anim-style";
  style.textContent = `
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-up {
    animation: slide-up 0.4s ease-out;
  }
  `;
  document.head.appendChild(style);
}
