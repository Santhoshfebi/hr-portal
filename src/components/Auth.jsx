import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("candidate");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  // ✅ Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) navigate("/dashboard", { replace: true });
    };
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) navigate("/dashboard", { replace: true });
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  // ✅ Handle login/signup
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      if (isLogin) {
        // 🔹 LOGIN FLOW
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (!data.session) {
          setMessage({
            text: "Please verify your email before logging in.",
            type: "error",
          });
          return;
        }
        setMessage({ text: "✅ Logged in successfully!", type: "success" });
      } else {
        // 🔹 SIGNUP FLOW
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role, full_name: fullName, phone },
          },
        });
        if (error) throw error;

        const user = data?.user;
        if (user) {
          // ✅ Store details in 'profiles' table
          const { error: profileError } = await supabase.from("profiles").insert([
            {
              id: user.id,
              email,
              full_name: fullName,
              phone,
              role,
              created_at: new Date(),
            },
          ]);
          if (profileError) console.error("Profile insert error:", profileError.message);

          // ✅ If candidate, create initial record in 'candidates'
          if (role === "candidate") {
            const { error: candidateError } = await supabase.from("candidates").insert([
              {
                user_id: user.id,
                email,
                phone,
                full_name: fullName,
              },
            ]);
            if (candidateError) console.error("Candidate insert error:", candidateError.message);
          }
        }

        setMessage({
          text: "✅ Signup successful! Please check your email to confirm your account.",
          type: "success",
        });

        // Reset form fields
        setFullName("");
        setPhone("");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-b from-blue-50 to-white px-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
      >
        <h2 className="text-3xl font-extrabold text-center text-blue-700 mb-2">
          {isLogin ? "Welcome Back!" : "Create Account"}
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {isLogin
            ? "Login to access your HR portal dashboard."
            : "Sign up to start your journey."}
        </p>

        {/* ✅ Role Selector */}
        {!isLogin && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setRole("candidate")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  role === "candidate"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole("recruiter")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  role === "recruiter"
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                Recruiter
              </button>
            </div>
          </div>
        )}

        {/* ✅ Feedback message */}
        {message.text && (
          <div
            className={`text-center p-2 rounded-md mb-4 ${
              message.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* ✅ Auth Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={isLogin ? "login" : "signup"}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleAuth}
          >
            <div className="space-y-4">
              {!isLogin && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </>
              )}

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg text-white font-semibold transition ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading
                  ? "Processing..."
                  : isLogin
                  ? "Login"
                  : "Create Account"}
              </button>
            </div>
          </motion.form>
        </AnimatePresence>

        {/* Toggle between login/signup */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="mt-2 text-blue-600 font-medium hover:underline transition"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
