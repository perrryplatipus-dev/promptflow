import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, ShieldAlert, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'admin@promptflow.ai',
      password: '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    const formattedEmail = data.email.trim().toLowerCase();

    if (formattedEmail !== 'admin@promptflow.ai') {
      toast.error('Access denied. This portal is restricted to system administrators.');
      setLoading(false);
      return;
    }

    try {
      await login(formattedEmail, data.password);
      toast.success('Admin authorization successful! Welcome to the Admin Portal.');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error((err as Error).message || 'Invalid administrator password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Red Warning Orb for Admin Area */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 shadow-xl shadow-red-500/20 mb-3">
            <ShieldAlert className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Prompt<span className="text-red-500">Flow</span> Admin Portal
          </span>
          <p className="text-xs text-slate-400 mt-1">Authorized personnel only. Access is monitored and logged.</p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel p-8 rounded-2xl border border-red-500/10 shadow-2xl bg-slate-900/60">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Admin Username
              </label>
              <input
                type="email"
                readOnly
                {...register('email', { required: 'Admin email is required' })}
                className="w-full px-4 py-2.5 text-xs text-slate-450 bg-slate-950 border border-slate-800 rounded-xl outline-none select-none cursor-not-allowed"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoFocus
                  {...register('password', { required: 'Security password is required' })}
                  className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500/50 rounded-xl transition"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-amber-500 hover:opacity-95 rounded-xl shadow-lg shadow-red-500/10 border border-red-500/20 disabled:opacity-50 transition"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate Admin
                  <Sparkles size={13} />
                </>
              )}
            </button>

          </form>
        </div>

        <p className="text-center text-[10px] text-slate-500 mt-6">
          System Admin: `admin@promptflow.ai` / `admin`
        </p>
      </div>

    </div>
  );
};
export default AdminLogin;
