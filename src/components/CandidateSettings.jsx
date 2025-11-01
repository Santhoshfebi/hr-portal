// src/components/CandidateSettings.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { LogOut, Key, Bell, Palette } from "lucide-react";

export default function CandidateSettings({ user, profile, onLogout, toast }) {
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setUpdating(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage("📧 Password reset link sent to your email.");
    } catch (err) {
      console.error("Password reset error:", err.message);
      setMessage("Failed to send reset link.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="text-gray-600 mb-6">
        Manage your account preferences, security, and notifications.
      </p>

      {/* Account Info */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Full Name</p>
            <p className="font-medium text-gray-800">{profile?.full_name || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium text-gray-800">{profile?.email || "—"}</p>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Key size={18} /> Security
        </h2>
        <p className="text-gray-600 text-sm">
          You can reset your password using your registered email.
        </p>
        <button
          onClick={handlePasswordReset}
          disabled={updating}
          className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
            updating ? "bg-sky-400" : "bg-sky-600 hover:bg-sky-700"
          }`}
        >
          {updating ? "Sending..." : "Send Password Reset Email"}
        </button>
        {message && <p className="text-sm text-gray-700 mt-2">{message}</p>}
      </div>

      {/* Notifications (placeholder for later) */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Bell size={18} /> Notifications
        </h2>
        <p className="text-gray-600 text-sm">Manage job alert and email notifications.</p>
        <button
          disabled
          className="bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg cursor-not-allowed"
        >
          Coming soon
        </button>
      </div>

      {/* Theme (placeholder for later) */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Palette size={18} /> Appearance
        </h2>
        <p className="text-gray-600 text-sm">Toggle between light and dark themes.</p>
        <button
          disabled
          className="bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg cursor-not-allowed"
        >
          Coming soon
        </button>
      </div>

      {/* Logout */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-4">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-red-600 hover:underline font-medium"
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  );
}
