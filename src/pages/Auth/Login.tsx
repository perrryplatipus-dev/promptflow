import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Eye, EyeOff, Terminal, Sparkles, Mail, Lock, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';

declare const google: any;

// Simple JWT decoder to read Google OAuth credential tokens
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { googleClientId } = useSettings();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Google Simulator Modal states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleStep, setGoogleStep] = useState<'account' | 'password'>('account');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [showGooglePass, setShowGooglePass] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // GSI Google Sign-In setup
  useEffect(() => {
    /* global google */
    const gsiElement = document.getElementById('google-signin-button');
    if (!gsiElement) return;

    if (googleClientId && typeof google !== 'undefined') {
      try {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            setLoading(true);
            const profile = decodeJwt(response.credential);
            if (profile) {
              try {
                await login(profile.email, undefined, true, profile.name);
                toast.success(`Google Auth Successful! Welcome ${profile.name}`);
                navigate('/dashboard');
              } catch (e) {
                toast.error('Google registration failed.');
              }
            } else {
              toast.error('Failed to parse Google OAuth token.');
            }
            setLoading(false);
          }
        });

        google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large', width: 380 }
        );
      } catch (err) {
        console.error('Google Identity init error:', err);
      }
    }
  }, [googleClientId, navigate, login]);

  // Standard Email & Password Submit
  const onSubmit = async (data: any) => {
    setLoading(true);
    const email = data.email.trim().toLowerCase();
    
    // Prevent admin from logging in via regular login page
    if (email === 'admin@promptflow.ai') {
      toast.error('Admin accounts must authenticate via the restricted Admin Portal URL.');
      setLoading(false);
      return;
    }

    try {
      // 1. Verify if email exists in database
      
      // 2. Perform password check
      await login(email, data.password);
      toast.success('Signed in successfully! Welcome to PromptFlow.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google Simulation Handlers
  const handleGoogleSimulatorAccountSelect = (email: string) => {
    setGoogleEmail(email);
    setGoogleStep('password');
  };

  const handleCustomGoogleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailVal = customGoogleEmail.trim().toLowerCase();
    if (!emailVal) return;
    
    // Google verifies if the email ends with a real Google domain
    if (!emailVal.endsWith('@gmail.com') && !emailVal.endsWith('@googlemail.com')) {
      toast.error('Google could not find your Google Account. Please enter a valid @gmail.com address.');
      return;
    }
    
    setGoogleEmail(emailVal);
    setGoogleStep('password');
  };

  const handleGoogleSimulatorPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (googlePassword.length < 4) {
      toast.error('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    setShowGoogleModal(false);
    try {
      const name = googleEmail.split('@')[0].toUpperCase();
      await login(googleEmail, undefined, true, name);
      toast.success(`Google Auth Successful! Welcome ${name}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Google login failed.');
    } finally {
      setLoading(false);
      // Reset simulator state
      setGoogleStep('account');
      setGooglePassword('');
      setGoogleEmail('');
      setCustomGoogleEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Glowing Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#6C63FF]/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#5B8CFF] shadow-xl shadow-[#6C63FF]/25 mb-3">
            <Terminal className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Welcome to <span className="text-[#6C63FF]">PromptFlow</span>
          </span>
          <p className="text-xs text-slate-400 mt-1">Manage and benchmark prompts in real-time.</p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 shadow-2xl bg-slate-900/60">
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  placeholder="developer@promptflow.ai"
                  {...register('email', { 
                    required: 'Email address is required', 
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  className="w-full pl-10 pr-4 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                />
              </div>
              {errors.email && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.email.message}</span>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full pl-10 pr-10 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-550 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.password.message}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 mt-5 text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#5B8CFF] hover:opacity-95 rounded-xl shadow-lg shadow-[#6C63FF]/20 border border-[#6C63FF]/30 disabled:opacity-50 transition"
            >
              {loading ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <>
                  Sign In to Workspace
                  <Sparkles size={13} />
                </>
              )}
            </button>
          </form>

          {/* Google Login Section */}
          <>
            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <span className="absolute inset-x-0 h-px bg-slate-800/80" />
              <span className="relative px-3 text-[10px] font-semibold text-slate-500 bg-[#1e293b] select-none">
                OR CONTINUE WITH
              </span>
            </div>

            {/* Google Button */}
            <div className="flex justify-center w-full">
              {googleClientId ? (
                <div id="google-signin-button" className="w-full overflow-hidden flex justify-center" />
              ) : (
                <button
                  onClick={() => {
                    setGoogleStep('account');
                    setShowGoogleModal(true);
                  }}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 text-xs font-semibold text-slate-300 hover:text-slate-100 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Sign In with Google
                </button>
              )}
            </div>
          </>

        </div>

        {/* Footer Links */}
        <div className="flex flex-col gap-3 items-center justify-center mt-6">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#6C63FF] hover:underline font-semibold">
              Create Account
            </Link>
          </p>
        </div>
      </div>

      {/* HIGH-FIDELITY MOCK GOOGLE AUTHENTICATION OVERLAY */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-lg shadow-2xl border border-slate-200 overflow-hidden relative p-8">
            <button 
              onClick={() => setShowGoogleModal(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-full transition"
            >
              <X size={18} />
            </button>

            {/* Google Brand Logo */}
            <div className="flex flex-col items-center mb-6">
              <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <h2 className="text-xl font-medium tracking-tight text-slate-800">Sign in with Google</h2>
              <p className="text-xs text-slate-500 mt-1">to continue to PromptFlow</p>
            </div>

            {googleStep === 'account' ? (
              /* SCREEN 1: ACCOUNT SELECTION */
              <div className="space-y-4 text-left">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-left">Choose an account</span>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[
                    { name: 'Developer Account', email: 'developer@gmail.com', initials: 'D' },
                    { name: 'SaaS Tester', email: 'saas.tester@gmail.com', initials: 'S' }
                  ].map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleGoogleSimulatorAccountSelect(acc.email)}
                      className="w-full text-left p-3 border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                        {acc.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700">{acc.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{acc.email}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="relative my-4 flex items-center justify-center">
                  <span className="absolute inset-x-0 h-px bg-slate-200" />
                  <span className="relative px-2.5 text-[9px] font-bold text-slate-450 bg-white">OR USE A CUSTOM ADDRESS</span>
                </div>

                <form onSubmit={handleCustomGoogleEmailSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="your-name@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#4285F4] rounded-md text-slate-900 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-xs font-bold text-white bg-[#4285F4] hover:bg-[#357ae8] rounded-md transition"
                  >
                    Next
                  </button>
                </form>
              </div>
            ) : (
              /* SCREEN 2: PASSWORD PROMPT WITH TRY ANOTHER WAY */
              <form onSubmit={handleGoogleSimulatorPasswordSubmit} className="space-y-4 text-left">
                <div className="p-2 border border-slate-250 bg-slate-50 rounded-lg flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {googleEmail.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs text-slate-600 truncate flex-1">{googleEmail}</span>
                  <button 
                    type="button"
                    onClick={() => setGoogleStep('account')}
                    className="text-[10px] text-[#4285F4] hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Enter your Google account password
                  </label>
                  <div className="relative">
                    <input
                      type={showGooglePass ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="Enter password"
                      value={googlePassword}
                      onChange={(e) => setGooglePassword(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#4285F4] rounded-md transition text-slate-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGooglePass(!showGooglePass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent"
                    >
                      {showGooglePass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert(
                        "Google Verification Methods:\n\n" +
                        "1. Verify on phone 2FA prompt\n" +
                        "2. Receive SMS verification code\n\n" +
                        "For the simulated sandbox, click Next to authenticate directly with your Google password."
                      );
                    }}
                    className="text-left text-xs text-[#4285F4] hover:underline font-semibold cursor-pointer"
                  >
                    Try another way
                  </button>
                  
                  <span className="text-[10px] text-slate-400">Forgot Password?</span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setGoogleStep('account')}
                    className="px-3.5 py-2 text-xs font-bold text-[#4285F4] hover:bg-slate-50 rounded-md transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-[#4285F4] hover:bg-[#357ae8] rounded-md transition"
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
export default Login;
