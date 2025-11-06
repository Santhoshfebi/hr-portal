import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Briefcase } from "lucide-react";
import { supabase } from "../supabaseClient";

/* ---------------- Overview Component ---------------- */
export default function RecruiterOverview({ user }) {
  const [stats, setStats] = useState({
    totalApplicants: 0,
    newApplicantsToday: 0,
  });
  const [recentApplicants, setRecentApplicants] = useState([]);
  const [topJob, setTopJob] = useState(null);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Recruiter";

  useEffect(() => {
    if (!user) return;

    const fetchOverview = async () => {
      try {
        // Fetch recruiter's jobs
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("id, title")
          .eq("recruiter_id", user.id);

        if (jobsError) throw jobsError;
        const jobIds = jobsData.map((j) => j.id);

        let totalApplicants = 0;
        let newApplicantsToday = 0;
        let recentApplicantsData = [];
        let jobCountMap = {};

        if (jobIds.length > 0) {
          // Fetch all applications for those jobs
          const { data: applicationsData, error: appsError } = await supabase
            .from("applications")
            .select(
              "id, status, created_at, job_id, candidate:candidates(full_name), job:jobs(title)"
            )
            .in("job_id", jobIds);

          if (appsError) throw appsError;

          totalApplicants = applicationsData.length;

          const today = new Date().toISOString().split("T")[0];
          newApplicantsToday = applicationsData.filter(
            (a) => a.created_at.startsWith(today)
          ).length;

          // Count applicants per job
          applicationsData.forEach((a) => {
            const jobTitle = a.job?.title || "Unknown Role";
            jobCountMap[jobTitle] = (jobCountMap[jobTitle] || 0) + 1;
          });

          // Find top job posting
          const topJobEntry = Object.entries(jobCountMap).sort(
            (a, b) => b[1] - a[1]
          )[0];
          if (topJobEntry) {
            setTopJob({ title: topJobEntry[0], count: topJobEntry[1] });
          } else {
            setTopJob(null);
          }

          // Sort and pick 5 most recent applicants
          recentApplicantsData = applicationsData
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map((a) => ({
              name: a.candidate?.full_name || "Unknown Candidate",
              jobTitle: a.job?.title || "Unknown Role",
            }));
        }

        setStats({ totalApplicants, newApplicantsToday });
        setRecentApplicants(recentApplicantsData);
      } catch (err) {
        console.error("Error fetching overview:", err);
      }
    };

    fetchOverview();
  }, [user]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-3xl font-bold mb-2 text-gray-900">
        Welcome back, {firstName}
      </h1>
      <p className="text-gray-600 mb-8">
        Here’s a quick overview of your recruitment activity.
      </p>

      {/* ✅ Two Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <AnimatedStatCard
          title="Total Applicants"
          value={stats.totalApplicants}
          icon={<Users size={26} className="text-emerald-600" />}
          color="#22c55e"
        />
        <AnimatedStatCard
          title="New Applicants Today"
          value={stats.newApplicantsToday}
          icon={<UserPlus size={26} className="text-sky-600" />}
          color="#0ea5e9"
        />
      </div>

      {/* ✅ Top Job Posting Widget */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-sky-50 rounded-full">
            <Briefcase className="text-sky-600" size={22} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Top Job Posting</h2>
        </div>

        {topJob ? (
          <div>
            <p className="text-gray-900 text-xl font-semibold">{topJob.title}</p>
            <p className="text-gray-500 text-sm">
              {topJob.count} applicant{topJob.count !== 1 ? "s" : ""} so far
            </p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No job postings with applicants yet.</p>
        )}
      </div>

      {/* ✅ Recent Applicants */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Applicants</h2>
        </div>
        {recentApplicants.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent applicants yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {recentApplicants.map((a, i) => (
              <li key={i} className="flex justify-between py-2">
                <span className="font-medium text-gray-700">{a.name}</span>
                <span className="text-gray-500">{a.jobTitle}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.section>
  );
}

/* ---------------- Animated Stat Card ---------------- */
function AnimatedStatCard({ title, value, icon, color }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value || 0;
    const duration = 800;
    const stepTime = 16;
    const increment = end / (duration / stepTime);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(Math.floor(start));
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-all duration-300"
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${color}33 0%, ${color}1A 100%)`,
        }}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-semibold text-gray-900">
          {count.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}
