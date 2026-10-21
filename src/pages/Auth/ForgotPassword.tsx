import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Terminal, Send, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (_data: any) => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      toast.error('Failed to send reset link. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Glowing Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#6C63FF]/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#5B8CFF] shadow-xl shadow-[#6C63FF]/25 mb-3">
            <Terminal className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Reset your password
          </span>
          <p className="text-xs text-slate-400 mt-1">We will send a secure link to recover your account.</p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 shadow-2xl">
          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Email Address */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="developer@promptflow.ai"
                  {...register('email', { 
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-900 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                />
                {errors.email && (
                  <span className="text-[10px] text-red-500 mt-1 block">{errors.email.message}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#5B8CFF] hover:opacity-95 rounded-xl shadow-lg shadow-[#6C63FF]/20 border border-[#6C63FF]/30 disabled:opacity-50 transition"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Recovery Link
                    <Send size={13} />
                  </>
                )}
              </button>

            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                <Send size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-200">Email Sent!</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check your inbox at <b>{watch('email')}</b> for password reset instructions. If it doesn't arrive within 5 minutes, check your spam folder.
              </p>
              
              <button
                onClick={() => setSent(false)}
                className="text-xs text-[#6C63FF] hover:underline font-semibold"
              >
                Resend Email
              </button>
            </div>
          )}
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 hover:text-slate-200 transition">
            <ArrowLeft size={13} />
            Back to Sign In
          </Link>
        </p>
      </div>

    </div>
  );
};
