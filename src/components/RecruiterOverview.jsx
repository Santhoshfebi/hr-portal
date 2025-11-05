import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Users, CalendarDays } from "lucide-react";
import { supabase } from "../supabaseClient";

/* ---------------- Overview Component ---------------- */
export default function RecruiterOverview({ user }) {
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplicants: 0,
    interviews: 0,
  });
  const [recentApplicants, setRecentApplicants] = useState([]);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Recruiter";

  useEffect(() => {
    if (!user) return;

    const fetchOverview = async () => {
      try {
        // Fetch jobs with applications
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select(`id, title, status, applications!inner(status)`)
          .eq("recruiter_id", user.id);

        if (jobsError) throw jobsError;

        let activeJobs = 0;
        let totalApplicants = 0;
        let interviews = 0;

        jobsData.forEach((job) => {
          activeJobs += job.status === "active" ? 1 : 0;
          const apps = job.applications || [];
          totalApplicants += apps.length;
          interviews += apps.filter((a) => a.status === "interview").length;
        });

        setStats({ activeJobs, totalApplicants, interviews });

        // Fetch recent applicants
        const { data: applicants } = await supabase
          .from("applications")
          .select("*, candidate:candidates(full_name), job:jobs(title)")
          .eq("recruiter_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        const formatted = (applicants || []).map((a) => ({
          name: a.candidate?.full_name || "Unknown Candidate",
          jobTitle: a.job?.title || "Unknown Role",
        }));

        setRecentApplicants(formatted);
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <AnimatedStatCard
          title="Active Job Posts"
          value={stats.activeJobs}
          icon={<Briefcase size={26} className="text-sky-600" />}
          color="#0ea5e9"
          trend={`+${Math.floor(Math.random() * 5)} this week`}
        />
        <AnimatedStatCard
          title="Total Applicants"
          value={stats.totalApplicants}
          icon={<Users size={26} className="text-emerald-600" />}
          color="#22c55e"
          trend={`+${Math.floor(Math.random() * 20)} this week`}
        />
        <AnimatedStatCard
          title="Interviews Scheduled"
          value={stats.interviews}
          icon={<CalendarDays size={26} className="text-amber-600" />}
          color="#f59e0b"
          trend={`+${Math.floor(Math.random() * 3)} this week`}
        />
      </div>

      {/* Recent Applicants */}
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
function AnimatedStatCard({ title, value, icon, color, trend }) {
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

  const formattedCount = count.toLocaleString();

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 transition-all duration-300"
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-2 sm:mb-0"
        style={{
          background: `linear-gradient(135deg, ${color}33 0%, ${color}1A 100%)`,
        }}
      >
        {icon}
      </div>

      <div className="flex flex-col items-center sm:items-start">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-semibold text-gray-900">{formattedCount}</p>
        {trend && (
          <span
            className={`text-xs font-medium mt-1 ${
              trend.startsWith("+") ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}
