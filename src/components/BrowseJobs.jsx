import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import {
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  Upload,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function BrowseJobs({ user, toast }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingJob, setApplyingJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);

  // Filters + Sorting + Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("Newest");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 9;

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
        .select(
          "id, title, description, location, requirements, company_name, salary_range, created_at"
        )
        .eq("status", "Open");

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

  /* ---------------- Apply Logic ---------------- */
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

      toast("✅ Application submitted successfully!", "success");
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

  /* ---------------- Filter + Sort + Pagination ---------------- */
  const locations = useMemo(
    () => ["All", ...new Set(jobs.map((j) => j.location).filter(Boolean))],
    [jobs]
  );
  const companies = useMemo(
    () => ["All", ...new Set(jobs.map((j) => j.company_name).filter(Boolean))],
    [jobs]
  );

  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(lower) ||
          j.company_name.toLowerCase().includes(lower) ||
          j.location?.toLowerCase().includes(lower)
      );
    }

    if (selectedLocation !== "All") {
      filtered = filtered.filter((j) => j.location === selectedLocation);
    }

    if (selectedCompany !== "All") {
      filtered = filtered.filter((j) => j.company_name === selectedCompany);
    }

    // Sorting
    filtered = filtered.sort((a, b) => {
      if (sortOption === "Newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortOption === "Oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (sortOption === "Highest Salary") {
        return (
          parseInt(b.salary_range?.match(/\d+/)?.[0] || 0) -
          parseInt(a.salary_range?.match(/\d+/)?.[0] || 0)
        );
      } else if (sortOption === "Lowest Salary") {
        return (
          parseInt(a.salary_range?.match(/\d+/)?.[0] || 0) -
          parseInt(b.salary_range?.match(/\d+/)?.[0] || 0)
        );
      }
      return 0;
    });

    return filtered;
  }, [jobs, searchTerm, sortOption, selectedLocation, selectedCompany]);

  const totalPages = Math.ceil(filteredAndSortedJobs.length / jobsPerPage);
  const paginatedJobs = filteredAndSortedJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  /* ---------------- UI ---------------- */
  if (loading)
    return (
      <div className="text-center py-16 text-gray-500 animate-pulse">
        Loading available jobs...
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Browse Jobs</h1>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-2.5 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-2 w-48 sm:w-64 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
            />
          </div>

          {/* Filters */}
          <select
            value={selectedLocation}
            onChange={(e) => {
              setSelectedLocation(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-400"
          >
            {locations.map((loc) => (
              <option key={loc}>{loc}</option>
            ))}
          </select>

          <select
            value={selectedCompany}
            onChange={(e) => {
              setSelectedCompany(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-400"
          >
            {companies.map((comp) => (
              <option key={comp}>{comp}</option>
            ))}
          </select>

          {/* Sort */}
          <div className="relative">
            <Filter
              size={15}
              className="absolute left-3 top-2.5 text-gray-400"
            />
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400"
            >
              {["Newest", "Oldest", "Highest Salary", "Lowest Salary"].map(
                (option) => (
                  <option key={option}>{option}</option>
                )
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Job Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedJobs.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500 border border-dashed border-gray-300 rounded-xl">
            No jobs found with the current filters.
          </div>
        )}

        {paginatedJobs.map((job) => (
          <motion.div
            key={job.id}
            whileHover={{ y: -3 }}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {job.title}
              </h2>
              <div className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                <Building2 size={15} /> {job.company_name || "Company"}
              </div>
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 text-gray-600 disabled:opacity-50"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 text-gray-600 disabled:opacity-50"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

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

              {/* Resume */}
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
