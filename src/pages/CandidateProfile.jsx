import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  FileText,
  Camera,
  Info,
  Loader2,
} from "lucide-react";

export default function CandidateProfile() {
  const [user, setUser] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [completion, setCompletion] = useState(0);
  const [missingFields, setMissingFields] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCandidate = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        navigate("/auth", { replace: true });
        return;
      }

      const currentUser = authData.user;
      setUser(currentUser);

      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (error) console.error(error);
      else {
        setCandidate(data);
        setResumeUrl(data.resume_url || "");
        setResumeName(data.resume_name || "No file uploaded");
        setAvatarUrl(
          data.profile_image ||
            currentUser.user_metadata?.avatar_url ||
            `https://api.dicebear.com/8.x/initials/svg?seed=${
              data?.full_name || "User"
            }`
        );
        calculateCompletion(data);
      }

      setLoading(false);
    };

    fetchCandidate();
  }, [navigate]);

  // ✅ Upload new profile image
  const handleUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      if (candidate?.profile_image && candidate.profile_image.includes("supabase.co")) {
        try {
          const oldPath = candidate.profile_image.split("/avatars/")[1];
          if (oldPath) {
            const { error: deleteError } = await supabase.storage
              .from("avatars")
              .remove([`avatars/${oldPath}`]);
            if (deleteError) console.warn("Old image deletion failed:", deleteError.message);
          }
        } catch (delErr) {
          console.warn("Couldn't delete old avatar:", delErr.message);
        }
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      await supabase
        .from("candidates")
        .update({ profile_image: publicUrl })
        .eq("user_id", user.id);

      setAvatarUrl(publicUrl);
      toast("Profile image updated successfully!", "success");
    } catch (error) {
      console.error("Upload error:", error);
      toast("Failed to upload profile image.", "error");
    } finally {
      setUploading(false);
    }
  };

  const calculateCompletion = (data) => {
    const fields = {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      education: data.education,
      experience: data.experience,
      skills: data.skills,
      resume_url: data.resume_url,
    };
    const filled = Object.values(fields).filter((f) => f && f.trim() !== "")
      .length;
    setCompletion(Math.round((filled / Object.keys(fields).length) * 100));

    const missing = Object.keys(fields).filter(
      (key) => !fields[key] || fields[key].trim() === ""
    );
    setMissingFields(missing);
  };

  const getProgressColor = () => {
    if (completion < 40) return "#ef4444";
    if (completion < 70) return "#facc15";
    return "#22c55e";
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-blue-600 font-semibold text-lg animate-pulse">
        Loading candidate profile...
      </div>
    );

  if (!candidate)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-600">
        <p className="text-lg">No candidate profile found.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white flex justify-center items-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-100 p-10 transition-all duration-500">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={getProgressColor()}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 * (1 - completion / 100)}
                className="transition-all duration-700"
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={avatarUrl}
                alt="Candidate"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
              />

              <label
                htmlFor="avatar-upload"
                className="absolute bottom-3 right-6 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-700 transition"
              >
                {uploading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Camera size={18} />
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-blue-700 mt-6">
            Candidate Profile
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your personal details and uploaded documents
          </p>

          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <Info size={14} />
            <span>{completion}% Profile Completed</span>
          </div>
        </div>

        {/* Profile Info */}
        <div className="divide-y divide-gray-100">
          <ProfileField icon={<User />} label="Full Name" value={candidate.full_name} />
          <ProfileField icon={<Mail />} label="Email" value={candidate.email} />
          <ProfileField icon={<Phone />} label="Phone" value={candidate.phone} />
          <ProfileField icon={<GraduationCap />} label="Education" value={candidate.education} />
          <ProfileField icon={<Briefcase />} label="Experience" value={candidate.experience} />
          <ProfileField icon={<FileText />} label="Skills" value={candidate.skills} />
        </div>

        {/* Resume Section */}
        <div className="mt-10 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Uploaded Resume
          </h3>

          {resumeUrl ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-gray-700 font-medium truncate flex items-center gap-2">
                  <FileText className="text-blue-600" size={18} />
                  {resumeName}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
                >
                  View Resume
                </a>
                <a
                  href={resumeUrl}
                  download={resumeName}
                  className="flex-1 text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Download Resume
                </a>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No resume uploaded yet.</p>
          )}
        </div>

        {missingFields.length > 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium flex items-center gap-2">
              <Info size={18} /> Complete your profile:
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {missingFields.map((field) => (
                <li key={field}>{field.replace("_", " ")}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center mt-10">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 font-medium hover:underline transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="text-blue-600">{icon}</div>
      <div>
        <p className="text-gray-800 font-medium">{label}</p>
        <p className="text-gray-500 text-sm">{value || "Not provided"}</p>
      </div>
    </div>
  );
}

// ✅ Modern Toast Notification System
function toast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = `
      fixed bottom-6 right-6 flex flex-col gap-3 items-end 
      sm:right-6 sm:bottom-6 z-[9999] p-2
    `;
    document.body.appendChild(container);
  }

  const config = {
    success: { color: "bg-green-600", icon: "✅" },
    error: { color: "bg-red-600", icon: "❌" },
    info: { color: "bg-blue-600", icon: "ℹ️" },
    warning: { color: "bg-yellow-500 text-black", icon: "⚠️" },
  };

  const { color, icon } = config[type] || config.info;

  const toastEl = document.createElement("div");
  toastEl.className = `
    flex items-center gap-2 min-w-[240px] sm:min-w-[280px]
    text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg
    transform transition-all duration-500 ${color}
    animate-fade-in-up
  `;
  toastEl.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.prepend(toastEl);

  setTimeout(() => {
    toastEl.classList.add("animate-fade-out");
    setTimeout(() => toastEl.remove(), 400);
  }, 3000);
}

if (!document.getElementById("toast-style")) {
  const style = document.createElement("style");
  style.id = "toast-style";
  style.textContent = `
    @keyframes fade-in-up {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes fade-out {
      0% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(20px); }
    }
    .animate-fade-in-up { animation: fade-in-up 0.4s ease-out; }
    .animate-fade-out { animation: fade-out 0.4s ease-in forwards; }
    @media (max-width: 640px) {
      #toast-container {
        right: 0;
        left: 0;
        bottom: 10px;
        align-items: center;
      }
    }
  `;
  document.head.appendChild(style);
}