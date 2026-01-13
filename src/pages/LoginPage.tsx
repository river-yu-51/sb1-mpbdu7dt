import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const looksUnverifiedError = (msg: string) => {
  const m = msg.toLowerCase();
  return (
    m.includes("confirm") ||
    m.includes("confirmed") ||
    m.includes("verify") ||
    m.includes("verification") ||
    m.includes("not confirmed") ||
    m.includes("email not confirmed")
  );
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isLoading } = useAuth();

  const qs = new URLSearchParams(location.search);
  const initialEmail = qs.get("email") ?? "";
  const verifiedParam = qs.get("verified"); // from /auth/callback -> /login?verified=1 or 0
  const verifyHint = qs.get("verify"); // from register -> /login?...&verify=1

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // split "error" vs "info" for nicer UX
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  // Show banners based on query params
  useEffect(() => {
    if (verifiedParam === "1") {
      setInfo("Email verified! You can sign in now.");
    } else if (verifiedParam === "0") {
      setInfo("Verification link expired or invalid. Please try signing in or resend verification.");
    } else if (verifyHint === "1") {
      setInfo("Account created. Check your email to verify, then come back here to sign in.");
    }
  }, [verifiedParam, verifyHint]);

  // Redirect when AuthContext has actually set the user
  useEffect(() => {
    if (user) navigate("/account", { replace: true });
  }, [user, navigate]);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0 && !submitting,
    [email, password, submitting]
  );

  const resendVerification = async () => {
    const e = email.trim();
    if (!e) {
      setError("Enter your email first, then click resend.");
      return;
    }

    setResending(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: e,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        console.error("[resend] error:", error);
        setError(error.message || "Could not resend verification email.");
        return;
      }

      setInfo("Verification email sent. Check your inbox (and spam).");
      setShowResend(false);
    } catch (err: any) {
      console.error("[resend] exception:", err);
      setError(err?.message || "Could not resend verification email.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setInfo(null);
    setShowResend(false);

    try {
      const loginPromise = login(email, password);

      // Wait up to 4s for login() to resolve, but don't assume failure if it doesn't
      const result = await Promise.race<"resolved" | "timeout">([
        loginPromise.then(() => "resolved"),
        new Promise<"timeout">((r) => setTimeout(() => r("timeout"), 4000)),
      ]);

      if (result === "resolved") {
        const ok = await loginPromise;
        if (!ok) {
          // Try to detect "unverified" by inspecting the last auth error via session check
          // (Your login() currently only returns boolean, so we can’t read the error directly.)
          setError("Invalid email or password.");
          setShowResend(true); // still useful if they typed right creds but aren't verified
          return;
        }
        navigate("/account");
        return;
      }

      // Timed out waiting for promise — check whether the session exists anyway.
      console.warn("[login-page] login() slow; checking session...");
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        navigate("/account");
        return;
      }

      setError("Sign-in is taking too long. Please try again.");
    } catch (err: any) {
      console.error("[login-page] error:", err);
      const msg = String(err?.message || "Login failed. Please try again.");

      if (looksUnverifiedError(msg)) {
        setError("Please verify your email before signing in.");
        setShowResend(true);
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-20 bg-grima-50 min-h-screen">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <LogIn className="h-12 w-12 text-grima-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to access your account and session notes</p>
          </div>

          {info && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
              {info}
            </div>
          )}

          {(error || (submitting && isLoading)) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error ?? "Signing you in…"}
            </div>
          )}

          {showResend && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6">
              <div className="font-semibold mb-1">Need a new verification email?</div>
              <div className="text-sm mb-3">
                Enter your email above, then click resend. Check spam/junk too.
              </div>
              <button
                type="button"
                onClick={resendVerification}
                disabled={resending || !email.trim()}
                className="px-4 py-2 rounded-lg bg-grima-primary text-white font-semibold hover:bg-grima-dark disabled:opacity-50"
              >
                {resending ? "Resending…" : "Resend verification email"}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                    // keep info banner unless user starts editing; optional:
                    // setInfo(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-grima-primary focus:border-transparent"
                  autoComplete="email"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-grima-primary focus:border-transparent"
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-grima-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-grima-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="text-grima-primary font-medium hover:text-grima-dark">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
