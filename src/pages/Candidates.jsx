import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [educationFilter, setEducationFilter] = useState("All");
  const [experienceFilter, setExperienceFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const candidatesPerPage = 9;

  /* -------------------- Fetch Data -------------------- */
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const { data, error } = await supabase
          .from("candidates")
          .select(
            "full_name, email, phone, education, experience, skills, resume_url, created_at"
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCandidates(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  /* -------------------- Derived Filters -------------------- */
  const educations = useMemo(() => {
    const list = Array.from(new Set(candidates.map((c) => c.education).filter(Boolean)));
    return ["All", ...list];
  }, [candidates]);

  const experiences = useMemo(() => {
    const list = Array.from(new Set(candidates.map((c) => c.experience).filter(Boolean)));
    return ["All", ...list];
  }, [candidates]);

  /* -------------------- Filter + Sort Logic -------------------- */
  const filteredCandidates = useMemo(() => {
    let filtered = candidates.filter((c) => {
      const matchesSearch =
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.skills?.toLowerCase().includes(search.toLowerCase());

      const matchesEducation =
        educationFilter === "All" || c.education === educationFilter;

      const matchesExperience =
        experienceFilter === "All" || c.experience === experienceFilter;

      return matchesSearch && matchesEducation && matchesExperience;
    });

    switch (sortBy) {
      case "oldest":
        filtered.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        break;
      case "az":
        filtered.sort((a, b) =>
          (a.full_name || "").localeCompare(b.full_name || "")
        );
        break;
      case "za":
        filtered.sort((a, b) =>
          (b.full_name || "").localeCompare(a.full_name || "")
        );
        break;
      case "newest":
      default:
        filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        break;
    }

    return filtered;
  }, [candidates, search, educationFilter, experienceFilter, sortBy]);

  /* -------------------- Pagination Logic -------------------- */
  const totalPages = Math.ceil(filteredCandidates.length / candidatesPerPage);
  const startIndex = (currentPage - 1) * candidatesPerPage;
  const currentCandidates = filteredCandidates.slice(
    startIndex,
    startIndex + candidatesPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 whenever filters/search/sort changes
  }, [search, educationFilter, experienceFilter, sortBy]);

  /* -------------------- Loading & Error States -------------------- */
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-gray-600">
        Loading candidates...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-20 text-red-600">
        Error: {error}
      </div>
    );
  }

  /* -------------------- Main UI -------------------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-sky-700">Candidate Profiles</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search name, email, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
            />
          </div>

          {/* Filters */}
          <select
            value={educationFilter}
            onChange={(e) => setEducationFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500"
          >
            {educations.map((edu, i) => (
              <option key={i} value={edu}>
                {edu}
              </option>
            ))}
          </select>

          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500"
          >
            {experiences.map((exp, i) => (
              <option key={i} value={exp}>
                {exp}
              </option>
            ))}
          </select>

          {/* Sorting Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500"
          >
            <option value="newest">Newest → Oldest</option>
            <option value="oldest">Oldest → Newest</option>
            <option value="az">Name (A–Z)</option>
            <option value="za">Name (Z–A)</option>
          </select>
        </div>
      </div>

      {/* Candidate Grid */}
      {currentCandidates.length === 0 ? (
        <p className="text-center text-gray-600">
          No candidates found for your filters.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCandidates.map((c, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.03 }}
                className="border border-gray-200 rounded-2xl p-6 bg-white shadow hover:shadow-lg transition"
              >
                <h2 className="text-lg font-semibold text-sky-700 mb-2">
                  {c.full_name || "Unnamed Candidate"}
                </h2>
                <p className="text-gray-600 text-sm mb-1">
                  📧 {c.email || "Not provided"}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  📞 {c.phone || "Not provided"}
                </p>

                <div className="text-gray-700 text-sm space-y-2 mb-4">
                  <p>
                    <span className="font-medium">🎓 Education:</span>{" "}
                    {c.education || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">💼 Experience:</span>{" "}
                    {c.experience || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">🛠 Skills:</span>{" "}
                    {c.skills || "N/A"}
                  </p>
                </div>

                {c.resume_url ? (
                  <a
                    href={c.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 rounded-lg transition"
                  >
                    📄 View Resume
                  </a>
                ) : (
                  <p className="text-sm text-gray-500 italic text-center">
                    No resume uploaded
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                currentPage === 1
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-sky-700 border-sky-200 hover:bg-sky-50"
              }`}
            >
              ← Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                currentPage === totalPages
                  ? "text-gray-400 border-gray-200 cursor-not-allowed"
                  : "text-sky-700 border-sky-200 hover:bg-sky-50"
              }`}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
