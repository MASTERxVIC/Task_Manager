import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

  // Public folder wali images ka array yahan define karde bhai
const mockupImages = [
  '/img1.jpg',
  '/img2.jpg',
  '/img3.jpg',
  '/img4.jpg',
  '/img5.jpg'
];


export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);


  // 5 seconds interval to randomly change image
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImgIndex((prevIndex) => {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * mockupImages.length);
        } while (nextIndex === prevIndex && mockupImages.length > 1);
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Email/Password Auth Handler
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    if (isSignUp) {
      // Sign Up Flow
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMsg(error.message);
      }
    } else {
      // Log In Flow
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Agar account exist nahi karta/credentials match nahi hote
        if (
          error.message.toLowerCase().includes("invalid login credentials") ||
          error.message.toLowerCase().includes("user not found")
        ) {
          setIsSignUp(true);
          setInfoMsg("Account not found. Redirected to Sign Up — please create your account.");
        } else {
          setErrorMsg(error.message);
        }
      }
    }

    setLoading(false);
  };

  // Google OAuth Handler
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) setErrorMsg(error.message);
  };

  return (
    <div className="min-h-screen w-full flex  overflow-hidden fixed inset-0">
      {/* Left Side: Login / Signup Form */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-8 sm:p-12 overflow-y-auto no-scrollbar task-bg z-10">
        <div className="max-w-md w-full mx-auto my-auto">
          <h2 className="text-3xl font-bold mb-2 text-surface">
            {isSignUp ? 'Create your free account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            {isSignUp ? 'Sign up to create your private task list.' : 'Log in to view your tasks and manage your boards.'}
          </p>

          {infoMsg && (
            <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm p-3 rounded-lg mb-4">
              {infoMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">
              {errorMsg}
            </div>
          )}

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-surface hover:border-white hover:text-white text-surface font-medium py-2.5 rounded-full text-sm transition-colors mb-4 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                strokeWidth="0.6"
                strokeLinejoin="round"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                strokeWidth="0.6"
                strokeLinejoin="round"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                strokeWidth="0.6"
                strokeLinejoin="round"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                strokeWidth="0.6"
                strokeLinejoin="round"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="border-t border-surface/15 w-full"></div>
            <span className="bg-surface rounded-full px-3 text-xs text-white/80 uppercase absolute">or</span>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@gmail.com"
                className="w-full bg-surface/10 border border-surface/20 text-surface-raised rounded-full px-3.5 py-2.5 text-sm focus:outline-none focus:border-surface"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface/10 border border-surface/20 text-surface-raised rounded-full px-3.5 py-2.5 text-sm focus:outline-none focus:border-surface"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-surface text-white font-medium py-2.5 rounded-full text-sm transition-colors cursor-pointer hover:opacity-90"
            >
              {loading ? 'Processing...' : isSignUp ? 'Continue' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className="text-xs text-gray-400 hover:text-surface transition-colors cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Dynamic Image Rotator */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-[#0a0a0a] relative overflow-hidden items-center justify-center p-12">
        <div className="w-full h-full max-w-lg max-h-[600px] relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center bg-black/40">
          <img
            key={currentImgIndex}
            src={mockupImages[currentImgIndex]}
            alt="App Preview Showcase"
            className="w-full h-full object-cover transition-opacity duration-1000 animate-fadeIn"
          />
        </div>
      </div>
    </div>
  );
}