import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);

  // Email/Password Auth Handler (Functionality untouched)
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMsg(error.message);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("invalid login credentials") ||
          error.message.toLowerCase().includes("user not found")
        ) {
          setIsSignUp(true);
          setInfoMsg(
            "Account not found. Redirected to Sign Up — please create your account.",
          );
        } else {
          setErrorMsg(error.message);
        }
      }
    }

    setLoading(false);
  };

  // Google OAuth Handler (Functionality untouched)
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) setErrorMsg(error.message);
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden fixed inset-0 bg-[#FDFBF7]">
      {/* Top-Left Corner Direct SVG */}
      <div className="absolute top-0 left-0 pointer-events-none z-10 w-80 h-80 overflow-hidden">
        <svg
          viewBox="-10 -10 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            fill="#FDD739"
            d="M50.6,-36.3C64.4,-23.1,73.6,-2.1,71.1,19C68.5,40.1,54.1,61.4,36.6,66C19,70.7,-1.8,58.8,-24.1,48.6C-46.4,38.4,-70.3,30,-75.1,15.3C-80,0.6,-65.8,-20.2,-50.1,-33.9C-34.4,-47.6,-17.2,-54.1,0.6,-54.6C18.4,-55.1,36.8,-49.5,50.6,-36.3Z"
          />
        </svg>
      </div>

      {/* Left Side: Warm & Friendly Form with SVGs in Corners */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-8 sm:p-14 overflow-y-auto no-scrollbar z-10 relative">
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          {/* Header Title & Subtitle */}
          <div className="space-y-1.5">
            <h2 className="text-3xl font-sans font-extrabold tracking-tight text-[#1E1E24]">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h2>
            <p className="text-sm font-sans text-gray-600">
              {isSignUp
                ? "Sign up to create your private task list."
                : "Log in to view your tasks and manage your boards."}
            </p>
          </div>

          {infoMsg && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs p-3.5 rounded-2xl">
              {infoMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3.5 rounded-2xl">
              {errorMsg}
            </div>
          )}

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 text-[#1E1E24] font-medium py-3 px-4 rounded-full text-sm transition-all duration-200 cursor-pointer shadow-sm hover:border-gray-300"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-[#FDFBF7] px-3 text-[11px] font-medium text-gray-400 uppercase tracking-widest absolute">
              or
            </span>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 ml-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@gmail.com"
                className="w-full bg-white border border-gray-200 text-[#1E1E24] placeholder-gray-400 rounded-full px-4.5 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-gray-200 text-[#1E1E24] placeholder-gray-400 rounded-full px-4.5 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E1E24] hover:bg-black text-white font-medium py-3 rounded-full text-sm transition-all duration-200 cursor-pointer shadow-md active:scale-[0.99] mt-2"
            >
              {loading ? "Processing..." : isSignUp ? "Continue" : "Log In"}
            </button>
          </form>

          {/* Toggle Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className="text-xs font-medium text-gray-500 hover:text-[#1E1E24] transition-colors cursor-pointer"
            >
              {isSignUp
                ? "Already have an account? Log In"
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>   
         {/* Bottom-Right Corner SVG from public folder */}
      <div className="absolute bottom-0 right-0 pointer-events-none z-10 w-80 h-80 overflow-hidden">
        <svg viewBox="-100 -100 100 100" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#FDD739"
            d="M46.6,-53.7C59.1,-45.1,67.1,-29.2,68.1,-13.5C69.1,2.2,63.1,17.6,55.4,32.9C47.6,48.2,38.1,63.4,25.5,66.3C12.9,69.3,-2.8,60,-21.9,55.2C-41.1,50.4,-63.8,50.2,-76.7,38.9C-89.7,27.6,-92.9,5.3,-88.5,-14.9C-84,-35,-71.9,-53.1,-55.9,-61.2C-39.8,-69.3,-19.9,-67.3,-1.4,-65.6C17.1,-63.9,34.1,-62.4,46.6,-53.7Z"
          />
        </svg>
      </div>
      </div>

     

      {/* Right Side: Single Static Image (Completely untouched) */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-[#FDFBF7] relative overflow-hidden">
        <img
          src="/img.jpg"
          alt="App Preview Showcase"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
