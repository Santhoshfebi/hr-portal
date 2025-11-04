import { useState, useEffect } from "react";
import { Upload, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function CandidateProfile({
  user,
  formData,
  setFormData,
  avatarUrl,
  setAvatarUrl,
  toast,
}) {
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("candidates")
        .select("avatar_url")
        .eq("user_id", user.id)
        .single();
      if (!error && data?.avatar_url) {
        setFormData((p) => ({ ...p, avatar_url: data.avatar_url }));
        setAvatarUrl(data.avatar_url);
      }
    };
    fetchAvatar();
  }, [user, setFormData, setAvatarUrl]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from("candidates").upsert(
        {
          user_id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          education: formData.education,
          experience: formData.experience,
          skills: formData.skills,
          resume_url: formData.resume_url,
          avatar_url: formData.avatar_url,
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
      toast("Profile updated successfully!", "success");
    } catch (err) {
      toast("Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return toast("Select an image first.", "info");
    if (!avatarFile.type.startsWith("image/"))
      return toast("Please upload a valid image.", "error");
    if (avatarFile.size > 2 * 1024 * 1024)
      return toast("Image must be smaller than 2MB.", "warning");

    setUploadingAvatar(true);
    try {
      const ext = avatarFile.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
      setAvatarUrl(publicUrl); // ✅ sidebar updates immediately

      const { error } = await supabase
        .from("candidates")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);
      if (error) throw error;

      toast("Profile photo updated!", "success");
    } catch (err) {
      toast(err.message || "Upload failed.", "error");
    } finally {
      setUploadingAvatar(false);
      setAvatarFile(null);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!formData.avatar_url) return;
    if (!window.confirm("Remove your profile photo?")) return;
    try {
      const path = decodeURIComponent(formData.avatar_url.split("/avatars/")[1].split("?")[0]);
      await supabase.storage.from("avatars").remove([path]);
      await supabase
        .from("candidates")
        .update({ avatar_url: null })
        .eq("user_id", user.id);

      setFormData((p) => ({ ...p, avatar_url: null }));
      setAvatarUrl(null); // ✅ instantly clears sidebar
      toast("Profile photo removed.", "warning");
    } catch (err) {
      toast("Failed to remove photo.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Profile Information</h1>

      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <img
            src={formData.avatar_url || "https://via.placeholder.com/120?text=Profile"}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border border-gray-300 shadow-sm"
          />
          {formData.avatar_url && (
            <button
              onClick={handleRemoveAvatar}
              className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
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
            className={`mt-2 px-4 py-1.5 rounded-lg text-white text-sm flex items-center gap-2 ${
              uploadingAvatar || !avatarFile
                ? "bg-sky-400 cursor-not-allowed"
                : "bg-sky-600 hover:bg-sky-700"
            }`}
          >
            {uploadingAvatar ? "Uploading..." : <><Upload size={14}/> Upload</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput label="Full Name" value={formData.full_name} onChange={(v) => setFormData((p) => ({ ...p, full_name: v }))} />
        <TextInput label="Email" value={formData.email} disabled />
        <TextInput label="Phone" value={formData.phone} onChange={(v) => setFormData((p) => ({ ...p, phone: v }))} />
        <TextInput label="Education" value={formData.education} onChange={(v) => setFormData((p) => ({ ...p, education: v }))} />
        <TextInput label="Experience" value={formData.experience} onChange={(v) => setFormData((p) => ({ ...p, experience: v }))} />
        <TextInput label="Skills" value={formData.skills} onChange={(v) => setFormData((p) => ({ ...p, skills: v }))} />
      </div>

      <button
        onClick={handleSaveProfile}
        disabled={saving}
        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white transition ${
          saving ? "bg-sky-400 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-700"
        }`}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function TextInput({ label, value, onChange, disabled = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none ${
          disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"
        }`}
      />
    </div>
  );
}
