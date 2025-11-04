import { useState } from "react";
import { Upload, Trash2, FileText, FileType } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function CandidateResume({ user, formData, setFormData, toast }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ---------------- Upload Resume ----------------
  const handleResumeUpload = async () => {
    if (!resumeFile) return toast("Please select a file to upload.", "info");

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(resumeFile.type))
      return toast("Please upload a PDF or Word document.", "error");

    if (resumeFile.size > 5 * 1024 * 1024)
      return toast("File size must be under 5MB.", "warning");

    setUploading(true);
    try {
      const ext = resumeFile.name.split(".").pop();
      const fileName = `${user.id}.${ext}`;
      const filePath = `resumes/${fileName}`;

      // Upload or overwrite file in Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from("resumes")
        .upload(filePath, resumeFile, { upsert: true });

      if (uploadErr) throw uploadErr;

      // Get the public URL
      const { data } = supabase.storage.from("resumes").getPublicUrl(filePath);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      // ---------------- Update both tables ----------------
      // Update in candidates table
      const { error: candErr } = await supabase
        .from("candidates")
        .update({
          resume_url: publicUrl,
          resume_name: resumeFile.name,
        })
        .eq("user_id", user.id);

      if (candErr) throw candErr;

      // Update in profiles table
      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          resume_url: publicUrl,
          resume_name: resumeFile.name,
        })
        .eq("id", user.id); // or .eq("user_id", user.id) if your profiles table uses that column

      if (profErr) throw profErr;

      // Update local state
      setFormData((prev) => ({
        ...prev,
        resume_url: publicUrl,
        resume_name: resumeFile.name,
      }));

      toast("Resume uploaded successfully!", "success");
    } catch (err) {
      console.error("Resume upload error:", err);
      toast(err.message || "Failed to upload resume.", "error");
    } finally {
      setUploading(false);
      setResumeFile(null);
    }
  };

  // ---------------- Remove Resume ----------------
  const handleRemoveResume = async () => {
    if (!formData.resume_url) return;
    if (!window.confirm("Are you sure you want to delete your resume?")) return;

    setDeleting(true);
    try {
      const path = decodeURIComponent(
        formData.resume_url.split("/resumes/")[1].split("?")[0]
      );

      // Delete from storage
      const { error: removeErr } = await supabase.storage
        .from("resumes")
        .remove([path]);
      if (removeErr) throw removeErr;

      // Remove from both tables
      const { error: candErr } = await supabase
        .from("candidates")
        .update({ resume_url: null, resume_name: null })
        .eq("user_id", user.id);
      if (candErr) throw candErr;

      const { error: profErr } = await supabase
        .from("profiles")
        .update({ resume_url: null, resume_name: null })
        .eq("id", user.id);
      if (profErr) throw profErr;

      // Update UI
      setFormData((prev) => ({
        ...prev,
        resume_url: null,
        resume_name: null,
      }));

      toast("Resume deleted successfully.", "warning");
    } catch (err) {
      console.error("Remove resume error:", err);
      toast(err.message || "Failed to remove resume.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const fileIcon =
    formData.resume_name?.endsWith(".pdf") ? (
      <FileText className="text-red-500" size={18} />
    ) : (
      <FileType className="text-blue-500" size={18} />
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Manage Resume</h1>

      {/* Upload Section */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Upload Resume (PDF or Word)
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResumeFile(e.target.files[0])}
            className="text-sm text-gray-600"
          />
          <button
            onClick={handleResumeUpload}
            disabled={uploading || !resumeFile}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${
              uploading || !resumeFile
                ? "bg-sky-400 cursor-not-allowed"
                : "bg-sky-600 hover:bg-sky-700"
            }`}
          >
            {uploading ? (
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
                <Upload size={16} />
                Upload
              </>
            )}
          </button>
        </div>
      </div>

      {/* Display Uploaded Resume */}
      {formData.resume_url ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 border p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm text-gray-700">
            {fileIcon}
            <a
              href={formData.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline font-medium"
            >
              {formData.resume_name || "View Uploaded Resume"}
            </a>
          </div>

          <button
            onClick={handleRemoveResume}
            disabled={deleting}
            className={`flex items-center gap-1 mt-3 sm:mt-0 text-sm text-red-600 hover:text-red-800 ${
              deleting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Trash2 size={14} />
            {deleting ? "Removing..." : "Remove"}
          </button>
        </div>
      ) : (
        <p className="text-gray-500 italic text-sm">No resume uploaded yet.</p>
      )}
    </div>
  );
}
