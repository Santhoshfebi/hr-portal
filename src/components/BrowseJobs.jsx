import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  Paperclip,
  Upload,
  FileText,
} from "lucide-react";

export default function BrowseJobs({ user, toast }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingJob, setApplyingJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);

  /* ---------------- Fetch Open Jobs ---------------- */
  useEffect(() => {
    fetchJobs();
    if (user) fetchResume();
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, description, location, company_name, salary_range, created_at")
        .eq("status", "Open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      toast("Unable to load jobs.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Fetch Candidate Resume ---------------- */
  const fetchResume = async () => {
    try {
      const { data, error } = await supabase
        .from("candidates")
        .select("resume_url, resume_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setResume(data);
    } catch (err) {
      console.error("Resume fetch error:", err);
      toast("Could not load your resume.", "error");
    }
  };

  /* ---------------- Handle Application ---------------- */
  const handleApply = (job) => {
    if (!user) return toast("Please sign in to apply for jobs.", "error");
    if (!resume?.resume_url)
      return toast("Please upload your resume before applying.", "error");
    setApplyingJob(job);
  };

  const submitApplication = async () => {
    if (!applyingJob || !user) return;
    setSubmitting(true);

    try {
      // ✅ Step 1: Check for existing application first
      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", applyingJob.id)
        .eq("candidate_id", user.id)
        .maybeSingle();

      if (existing) {
        toast("You’ve already applied for this job.", "info");
        return;
      }

      // ✅ Step 2: Upload cover letter (optional)
      let coverLetterUrl = null;
      if (coverLetter) {
        const fileExt = coverLetter.name.split(".").pop();
        const fileName = `${user.id}_${applyingJob.id}.${fileExt}`;
        const filePath = `cover_letters/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("cover_letters")
          .upload(filePath, coverLetter, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("cover_letters")
          .getPublicUrl(filePath);
        coverLetterUrl = publicData?.publicUrl || null;
      }

      // ✅ Step 3: Insert application
      const { error: insertError } = await supabase.from("applications").insert([
        {
          job_id: applyingJob.id,
          candidate_id: user.id,
          full_name: user.user_metadata?.full_name || user.email,
          email: user.email,
          resume_url: resume.resume_url,
          resume_name: resume.resume_name,
          cover_letter_url: coverLetterUrl,
          status: "Pending",
        },
      ]);

      if (insertError) throw insertError;

      toast("Application submitted successfully!", "success");
      setApplyingJob(null);
      setCoverLetter(null);
    } catch (err) {
      console.error("Application error:", err);
      toast("Could not submit your application.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- Format Date ---------------- */
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* ---------------- Render ---------------- */
  if (loading)
    return (
      <div className="text-center py-16 text-gray-500 animate-pulse">
        Loading available jobs...
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Browse Jobs</h1>
      </div>

      {/* Job Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-xl">
            No open jobs available right now.
          </div>
        )}

        {jobs.map((job) => (
          <motion.div
            key={job.id}
            whileHover={{ y: -4 }}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h2>
              <div className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                <Building2 size={15} /> {job.company_name || "Company"}
              </div>
              <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                {job.description}
              </p>
              {job.location && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <MapPin size={14} /> {job.location}
                </div>
              )}
              {job.salary_range && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <DollarSign size={14} /> {job.salary_range}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                <Calendar size={13} /> Posted {formatDate(job.created_at)}
              </div>
            </div>

            <button
              onClick={() => handleApply(job)}
              className="mt-6 w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition"
            >
              Apply Now
            </button>
          </motion.div>
        ))}
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {applyingJob && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Apply for{" "}
                <span className="text-sky-600">{applyingJob.title}</span>
              </h2>

              {/* Resume Section */}
              <div className="bg-gray-50 border rounded-lg p-3 mb-4 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <FileText size={16} className="text-sky-600" />
                  <strong>Resume:</strong>
                  {resume?.resume_name ? (
                    <a
                      href={resume.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:underline ml-1"
                    >
                      {resume.resume_name}
                    </a>
                  ) : (
                    <span className="text-red-500 ml-1">
                      No resume uploaded
                    </span>
                  )}
                </p>
              </div>

              {/* Cover Letter */}
              <div className="mb-5">
                <label className="block text-sm text-gray-600 mb-2">
                  Optional Cover Letter
                </label>
                <div className="flex items-center gap-2">
                  <Upload size={16} className="text-gray-400" />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setCoverLetter(e.target.files[0])}
                    className="text-sm text-gray-600"
                  />
                </div>
                {coverLetter && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected:{" "}
                    <span className="font-medium">{coverLetter.name}</span>
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setApplyingJob(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submitApplication}
                  disabled={submitting}
                  className={`px-5 py-2 rounded-lg text-white font-medium transition ${
                    submitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-sky-600 hover:bg-sky-700"
                  }`}
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
