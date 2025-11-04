import { useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";

/* -------------------------------------------------------------------------- */
/*                               Toast Utility                                */
/* -------------------------------------------------------------------------- */
function showToast(message, type = "info") {
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

  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className = `text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg animate-slide-up ${
    colors[type] || colors.info
  }`;

  container.prepend(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.45s, transform 0.45s";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(18px)";
    setTimeout(() => toast.remove(), 450);
  }, 2400);
}

/* -------------------------------------------------------------------------- */
/*                         Recruiter Profile Component                        */
/* -------------------------------------------------------------------------- */
export default function RecruiterProfile({
  user,
  profile,
  setProfile,
  avatarUrl,
  setAvatarUrl,
}) {
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  /* ---------------------------- Validation Logic ---------------------------- */
  const validateProfile = (p) => {
    const newErrors = {};
    if (!p.full_name?.trim()) newErrors.full_name = "Full name is required.";
    if (!p.company_name?.trim())
      newErrors.company_name = "Company name is required.";
    if (!p.position?.trim()) newErrors.position = "Position is required.";
    if (p.phone && !/^\+?\d{10,15}$/.test(p.phone))
      newErrors.phone = "Invalid phone number format.";
    return newErrors;
  };

  /* ------------------------------ Avatar Upload ----------------------------- */
  const handleAvatarUpload = async () => {
    if (!avatarFile) return showToast("Please select an image first.", "info");
    if (!user) return showToast("User not found.", "error");

    if (!avatarFile.type.startsWith("image/"))
      return showToast("Please upload a valid image file.", "error");
    if (avatarFile.size > 2 * 1024 * 1024)
      return showToast("Image must be smaller than 2MB.", "warning");

    setUploadingAvatar(true);
    try {
      const ext = avatarFile.name.split(".").pop();
      const filename = `${user.id}.${ext}`;
      const path = `avatars/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      setAvatarUrl(publicUrl);

      const { error: updateError } = await supabase
        .from("recruiters")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      showToast("Profile photo updated successfully!", "success");
    } catch (err) {
      console.error("Avatar upload error:", err);
      showToast(err.message || "Failed to upload profile photo.", "error");
    } finally {
      setUploadingAvatar(false);
      setAvatarFile(null);
    }
  };

  /* ------------------------------ Avatar Remove ----------------------------- */
  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return;
    if (!window.confirm("Remove your profile photo?")) return;

    try {
      const path = decodeURIComponent(
        avatarUrl.split("/avatars/")[1].split("?")[0]
      );

      const { error: removeError } = await supabase.storage
        .from("avatars")
        .remove([path]);
      if (removeError) throw removeError;

      const { error: updateError } = await supabase
        .from("recruiters")
        .update({ avatar_url: null })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      setAvatarUrl(null);
      showToast("Profile photo removed.", "warning");
    } catch (err) {
      console.error("Remove avatar error:", err);
      showToast(err.message || "Failed to remove profile photo.", "error");
    }
  };

  /* ------------------------------- Manual Save ------------------------------ */
  const handleSave = async () => {
    const validation = validateProfile(profile);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      showToast("Please fix the highlighted errors.", "warning");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("recruiters").upsert(
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
      if (error) throw error;

      showToast("Profile updated successfully!", "success");
    } catch (err) {
      console.error("Save error:", err);
      showToast("Failed to save profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------- Render ---------------------------------- */
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Recruiter Profile</h1>

      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <img
            src={avatarUrl || "https://via.placeholder.com/120?text=Profile"}
            alt="Profile Avatar"
            className="w-28 h-28 rounded-full object-cover border border-gray-300 shadow-sm"
          />
          {avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition"
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
            className={`mt-2 px-4 py-1.5 rounded-lg text-white text-sm flex items-center gap-2 transition ${
              uploadingAvatar || !avatarFile
                ? "bg-sky-400 cursor-not-allowed"
                : "bg-sky-600 hover:bg-sky-700"
            }`}
          >
            {uploadingAvatar ? "Uploading..." : "Upload Photo"}
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput
          label="Full Name"
          value={profile.full_name}
          onChange={(v) => setProfile((p) => ({ ...p, full_name: v }))}
          error={errors.full_name}
        />
        <TextInput label="Email" value={profile.email} disabled />
        <TextInput
          label="Phone Number"
          value={profile.phone}
          onChange={(v) => setProfile((p) => ({ ...p, phone: v }))}
          error={errors.phone}
        />
        <TextInput
          label="Company Name"
          value={profile.company_name}
          onChange={(v) => setProfile((p) => ({ ...p, company_name: v }))}
          error={errors.company_name}
        />
        <TextInput
          label="Position / Title"
          value={profile.position}
          onChange={(v) => setProfile((p) => ({ ...p, position: v }))}
          error={errors.position}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium transition ${
            saving
              ? "bg-sky-400 cursor-not-allowed"
              : "bg-sky-600 hover:bg-sky-700"
          }`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Text Input Field                              */
/* -------------------------------------------------------------------------- */
function TextInput({ label, value, onChange, disabled = false, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition ${
          disabled
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : error
            ? "border-red-500 focus:ring-red-500"
            : "focus:ring-sky-500 focus:border-sky-500"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
