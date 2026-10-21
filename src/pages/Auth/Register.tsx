import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Terminal, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      company: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await signup(data.name, data.email, data.company, data.password);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Glowing Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#5B8CFF]/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#5B8CFF] shadow-xl shadow-[#6C63FF]/25 mb-3">
            <Terminal className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Create your account
          </span>
          <p className="text-xs text-slate-400 mt-1">Get started with PromptFlow prompt benchmark suite.</p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-800/85 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Jane Doe"
                {...register('name', { required: 'Full name is required' })}
                className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-900 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
              />
              {errors.name && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.name.message}</span>
              )}
            </div>

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

            {/* Company Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Company Name (Optional)
              </label>
              <input
                type="text"
                placeholder="PromptLabs Inc."
                {...register('company')}
                className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-900 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-900 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.password.message}</span>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: (val) => val === password || 'Passwords do not match'
                })}
                className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-900 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
              />
              {errors.confirmPassword && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.confirmPassword.message}</span>
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
                  Create Account
                  <Sparkles size={13} />
                </>
              )}
            </button>

          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#6C63FF] hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>

    </div>
  );
};
