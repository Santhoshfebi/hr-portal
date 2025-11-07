import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function EmailConfirmSuccess() {
  const navigate = useNavigate();

  // ⏳ Auto-redirect after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard"); // or "/login" if you want them to sign in manually
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-b from-blue-50 to-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center"
      >
        <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4" />

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Email Verified Successfully!
        </h2>

        <p className="text-gray-600 mb-6">
          Your email has been confirmed. Welcome aboard! 🎉<br />
          You’ll be redirected to your dashboard shortly.
        </p>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="h-1 bg-blue-600 rounded-full"
        />

        <p className="text-xs text-gray-400 mt-3">
          Redirecting to dashboard...
        </p>
      </motion.div>
    </div>
  );
}
