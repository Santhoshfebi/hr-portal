import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Briefcase, CalendarDays, Clock4, AlertCircle } from "lucide-react";
import { supabase } from "../supabaseClient";

/* ---------------- Main Recruiter Overview ---------------- */
export default function RecruiterOverview({ user }) {
  const [stats, setStats] = useState({
    totalApplicants: 0,
    newApplicantsToday: 0,
    pendingApprovals: 0,
  });
  const [recentApplicants, setRecentApplicants] = useState([]);
  const [pendingApplicants, setPendingApplicants] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Recruiter";

  useEffect(() => {
    if (!user) return;
    fetchOverview();
  }, [user]);

  /* ---------------- Fetch Data ---------------- */
  const fetchOverview = async () => {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("recruiter_id", user.id);

      if (jobsError) throw jobsError;

      const jobIds = jobsData.map((j) => j.id);
      if (!jobIds.length) return;

      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select(
          "id, status, created_at, scheduled_at, job_id, candidate:candidates(full_name), job:jobs(title)"
        )
        .in("job_id", jobIds);

      if (appsError) throw appsError;

      processOverviewData(appsData);
    } catch (err) {
      console.error("Error fetching overview:", err);
    }
  };

  /* ---------------- Process Applications Data ---------------- */
  const processOverviewData = (applications) => {
    const totalApplicants = applications.length;

    const todayStr = new Date().toISOString().split("T")[0];
    const newApplicantsToday = applications.filter((a) =>
      a.created_at?.startsWith(todayStr)
    ).length;

    const pending = applications
      .filter(a => a.status?.toLowerCase() === "pending")
      .map(a => ({
        name: a.candidate?.full_name || "Unknown Candidate",
        jobTitle: a.job?.title || "Unknown Role"
      }));

    const recentApplicantsList = applications
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map((a) => ({ name: a.candidate?.full_name || "Unknown Candidate", jobTitle: a.job?.title || "Unknown Role" }));

    const now = new Date();
    const upcomingInterviews = applications
      .filter(
        (a) => a.status?.toLowerCase() === "interview" &&
               a.scheduled_at &&
               new Date(a.scheduled_at) > now
      )
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
      .slice(0, 5)
      .map((a) => ({
        name: a.candidate?.full_name || "Unknown Candidate",
        jobTitle: a.job?.title || "Unknown Role",
        scheduled_at: a.scheduled_at,
      }));

    setStats({
      totalApplicants,
      newApplicantsToday,
      pendingApprovals: pending.length
    });
    setRecentApplicants(recentApplicantsList);
    setPendingApplicants(pending);
    setUpcomingInterviews(upcomingInterviews);
  };

  const getProductivityMessage = (count) => {
    if (count === 0) return "No new applicants yet today — maybe share your job posts?";
    if (count < 5) return "A few new applicants today — good start!";
    if (count < 10) return "Great traction today — candidates are coming in!";
    return "Amazing! Lots of new applicants today — your jobs are shining!";
  };

  const formatInterviewTime = (dateStr) => {
    const date = new Date(dateStr);
    const diffDays = Math.floor((date - new Date()) / (1000 * 60 * 60 * 24));
    const dateLabel =
      diffDays === 0 ? "Today" : diffDays === 1 ? "Tomorrow" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const timeLabel = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${dateLabel}, ${timeLabel}`;
  };

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Header firstName={firstName} />
      <ProductivityHighlight count={stats.newApplicantsToday} message={getProductivityMessage(stats.newApplicantsToday)} />

      {/* ---------------- Stats Grid ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Applicants" value={stats.totalApplicants} icon={<Users size={28} className="text-white" />} gradient="from-emerald-500 to-emerald-400" />
        <StatCard title="New Applicants Today" value={stats.newApplicantsToday} icon={<Briefcase size={28} className="text-white" />} gradient="from-sky-500 to-sky-400" />
        <PendingApprovalsCard count={stats.pendingApprovals} pendingApplicants={pendingApplicants} />
      </div>

      {/* ---------------- Two-column Layout ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ListCard title="Recent Applicants" items={recentApplicants} icon={<Briefcase size={16} className="text-sky-500" />} />
        <UpcomingInterviewsCard interviews={upcomingInterviews} formatInterviewTime={formatInterviewTime} />
      </div>
    </motion.section>
  );
}

/* ---------------- Header ---------------- */
const Header = ({ firstName }) => (
  <>
    <h1 className="text-3xl font-bold mb-2 text-gray-900">Welcome back, {firstName}</h1>
    <p className="text-gray-600 mb-4">Here’s a quick overview of your recruitment activity.</p>
  </>
);

/* ---------------- Productivity Highlight ---------------- */
const ProductivityHighlight = ({ count, message }) => (
  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="mb-8">
    <div className="text-sm sm:text-base text-gray-700 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 shadow-sm flex items-start gap-2">
      <span className="text-xl">{count === 0 ? "💡" : count < 5 ? "😊" : count < 10 ? "🔥" : "🌟"}</span>
      <p className="leading-snug">{message}</p>
    </div>
  </motion.div>
);

/* ---------------- Unified Stat Card ---------------- */
function StatCard({ title, value, icon, gradient }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value || 0;
    const duration = 800;
    const stepTime = 16;
    const increment = end / (duration / stepTime);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); } 
      else setCount(Math.floor(start));
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-lg flex flex-col items-center gap-4 cursor-pointer transition hover:shadow-xl"
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 bg-linear-to-br ${gradient} shadow-md`}>
        {icon}
      </div>
      <div className="flex flex-col items-center">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-semibold text-gray-900">{count.toLocaleString()}</p>
      </div>
    </motion.div>
  );
}

/* ---------------- Pending Approvals Card ---------------- */
function PendingApprovalsCard({ count, pendingApplicants }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      layout
      onClick={() => setIsOpen(!isOpen)}
      whileHover={{ scale: 1.05 }}
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-lg flex flex-col items-center gap-4 cursor-pointer transition hover:shadow-xl"
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2 bg-linear-to-br from-red-500 to-red-400 shadow-md">
        <AlertCircle size={28} className="text-white" />
      </div>
      <div className="flex flex-col items-center">
        <p className="text-sm text-gray-500">Pending Approvals</p>
        <p className="text-3xl font-semibold text-gray-900">{count}</p>
      </div>

      <motion.div
        layout
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? "auto" : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full overflow-hidden mt-4"
      >
        {pendingApplicants.length === 0 ? (
          <p className="text-gray-500 text-sm text-center">No pending approvals.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {pendingApplicants.map((app, idx) => (
              <li key={idx} className="py-2 px-2 flex justify-between items-center hover:bg-red-50 rounded transition">
                <span className="font-medium text-gray-700">{app.name}</span>
                <span className="text-gray-500 text-xs px-2 py-0.5 bg-gray-100 rounded-full">{app.jobTitle}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ---------------- Generic List Card ---------------- */
function ListCard({ title, items, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition"
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No data available.</p>
      ) : (
        <ul className="divide-y divide-gray-100 text-sm">
          {items.map((item, idx) => (
            <li key={idx} className="flex justify-between items-center py-2 px-2 hover:bg-gray-50 rounded transition">
              <span className="font-medium text-gray-700">{item.name}</span>
              <span className="text-gray-500 text-xs px-2 py-0.5 bg-gray-100 rounded-full">{item.jobTitle}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

/* ---------------- Upcoming Interviews Card ---------------- */
function UpcomingInterviewsCard({ interviews, formatInterviewTime }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition"
    >
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="text-indigo-600" size={20} />
        <h2 className="text-lg font-semibold text-gray-800">Upcoming Interviews</h2>
      </div>
      {interviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <Clock4 size={22} className="mb-2 text-gray-400" />
          <p className="text-sm">No upcoming interviews scheduled.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 text-sm">
          {interviews.map((i, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex justify-between items-center py-3 hover:bg-indigo-50 rounded px-2 transition"
            >
              <div>
                <p className="font-medium text-gray-800">{i.name}</p>
                <p className="text-gray-500 text-xs">{i.jobTitle}</p>
              </div>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{formatInterviewTime(i.scheduled_at)}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
