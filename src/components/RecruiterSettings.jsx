// src/components/RecruiterSettings.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import { Lock, Mail, Building2, Bell, LogOut } from "lucide-react";

export default function RecruiterSettings({ user, profile, onLogout, toast }) {
  const [email] = useState(profile?.email || user?.email || "");
  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [notificationPref, setNotificationPref] = useState(true);
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast
        ? toast("Password reset email sent!", "success")
        : alert("Password reset email sent!");
    } catch (err) {
      console.error(err);
      toast
        ? toast("Failed to send password reset email.", "error")
        : alert("Error sending password reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("recruiters")
        .update({ company_name: companyName })
        .eq("user_id", user.id);

      if (error) throw error;
      toast
        ? toast("Settings updated successfully!", "success")
        : alert("Settings updated successfully!");
    } catch (err) {
      console.error(err);
      toast
        ? toast("Failed to update settings.", "error")
        : alert("Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6"
    >
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="text-gray-600 mb-6 text-sm">
        Manage your recruiter account preferences, password, and notifications.
      </p>

      <div className="space-y-6">
        {/* Company Info */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Company Name
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg px-3">
            <Building2 size={18} className="text-gray-500 mr-2" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="flex-1 py-2 outline-none"
              placeholder="Your company name"
            />
          </div>
        </div>

        {/* Password Reset */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Password
          </label>
          <div className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2">
            <div className="flex items-center text-gray-600">
              <Lock size={18} className="mr-2" />
              ********
            </div>
            <button
              onClick={handlePasswordReset}
              disabled={loading}
              className={`text-sm font-medium ${
                loading
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-sky-600 hover:underline"
              }`}
            >
              {loading ? "Sending..." : "Reset Password"}
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="flex items-center justify-between border border-gray-300 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-gray-600" />
            <div>
              <p className="font-medium text-gray-800 text-sm">Notifications</p>
              <p className="text-gray-500 text-xs">
                Receive email alerts for new applicants and job activity.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationPref}
              onChange={(e) => setNotificationPref(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-400 rounded-full peer peer-checked:bg-sky-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className={`w-full py-2.5 rounded-lg text-white font-semibold transition ${
            loading
              ? "bg-sky-400 cursor-not-allowed"
              : "bg-sky-600 hover:bg-sky-700"
          }`}
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full py-2.5 mt-3 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </motion.div>
  );
}
