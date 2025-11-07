import { useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error(error);
      // ✅ Redirect to dashboard if confirmed
      navigate("/dashboard");
    };
    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg text-blue-600 font-semibold">
        Confirming your email... please wait.
      </p>
    </div>
  );
}
