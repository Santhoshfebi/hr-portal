// Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: authData, error } = await supabase.auth.getUser();
        if (error || !authData?.user) {
          navigate("/auth", { replace: true });
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        if (profile?.role === "recruiter") {
          navigate("/recruiter", { replace: true });
        } else {
          navigate("/candidate", { replace: true });
        }
      } catch (err) {
        console.error("Error checking user:", err.message);
        navigate("/auth", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen text-gray-600">
      {loading ? "Loading dashboard..." : "Redirecting..."}
    </div>
  );
}
