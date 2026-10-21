import React, { useState } from 'react';
import { 
  User, 
  Key, 
  Bell, 
  Trash2, 
  Eye, 
  EyeOff, 
  Info,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { apiKeys, updateApiKeys, clearApiKeys, toggleTheme, notificationsEnabled, setNotificationsEnabled, googleClientId, updateGoogleClientId } = useSettings();

  const [activeTab, setActiveTab] = useState<'profile' | 'keys' | 'notifications' | 'danger'>('profile');

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileCompany, setProfileCompany] = useState(user?.company || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // API Keys Form States
  const [openaiKey, setOpenaiKey] = useState(apiKeys.openai || '');
  const [geminiKey, setGeminiKey] = useState(apiKeys.gemini || '');
  const [provA, setProvA] = useState<'openai' | 'gemini' | 'mock'>(apiKeys.providerA || 'mock');
  const [provB, setProvB] = useState<'openai' | 'gemini' | 'mock'>(apiKeys.providerB || 'mock');
  const [googleId, setGoogleId] = useState(googleClientId || '');
  
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const [saving, setSaving] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      updateProfile({
        name: profileName,
        email: profileEmail,
        company: profileCompany
      });
      setSaving(false);
      toast.success('Profile details updated successfully!');
    }, 800);
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      updateApiKeys({
        openai: openaiKey,
        gemini: geminiKey,
        providerA: provA,
        providerB: provB
      });
      updateGoogleClientId(googleId);
      setSaving(false);
      toast.success('API configurations updated!');
    }, 800);
  };

  const handleClearKeys = () => {
    setOpenaiKey('');
    setGeminiKey('');
    setProvA('mock');
    setProvB('mock');
    setGoogleId('');
    clearApiKeys();
    updateGoogleClientId('');
    toast.success('All API keys and client configurations deleted!');
  };

  const handleDeleteAccount = () => {
    const confirm = window.confirm('Are you absolutely sure you want to delete your account? This is irreversible.');
    if (confirm) {
      toast.success('Account deleted successfully.');
      logout();
    }
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Platform Settings</h1>
        <p className="text-xs text-slate-400">Configure your profile info, customize LLM API keys integrations, and toggles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Navigation Sidebar Tabs */}
        <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 lg:col-span-3 space-y-1">
          {[
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'keys', label: 'API Integrations', icon: Key },
            { id: 'notifications', label: 'Preferences', icon: Bell },
            { id: 'danger', label: 'Danger Zone', icon: ShieldAlert }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                activeTab === tab.id
                  ? 'bg-[#6C63FF]/15 text-[#6C63FF]'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents Main Area */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-9">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <span className="text-xs font-bold text-slate-200 block border-b border-slate-800 pb-2.5">
                Profile Information
              </span>

              {/* Avatar picker preview */}
              <div className="flex items-center gap-4">
                {user && (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#6C63FF]/20"
                  />
                )}
                <div>
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Profile Image</span>
                  <button
                    type="button"
                    onClick={() => toast('Image uploads simulated in sandbox.', { icon: 'ℹ️' })}
                    className="mt-1 px-3 py-1.5 bg-slate-900 border border-slate-800 text-[9px] font-semibold text-slate-350 hover:bg-slate-850 rounded-lg transition"
                  >
                    Change Avatar
                  </button>
                </div>
              </div>

              {/* Input grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-850 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-850 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={profileCompany}
                    onChange={(e) => setProfileCompany(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-850 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                  />
                </div>
              </div>

              {/* Password update group */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Change Password</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-850 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-850 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                  />
                </div>
              </div>

              {/* Save Footer button */}
              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#5B8CFF] hover:opacity-95 rounded-xl border border-[#6C63FF]/30 disabled:opacity-50 transition"
                >
                  {saving ? 'Saving changes...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}

          {/* KEYS TAB */}
          {activeTab === 'keys' && (
            <form onSubmit={handleSaveKeys} className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-200">
                  LLM API Integrations
                </span>
                
                <button
                  type="button"
                  onClick={handleClearKeys}
                  className="text-[10px] text-red-400 hover:underline font-semibold"
                >
                  Clear Keys
                </button>
              </div>

              {/* Info Banner */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 flex items-start gap-3">
                <Info size={16} className="text-[#00D4FF] mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Provide custom API keys to run real tests with LLM providers. By default, the application runs simulated mock streaming word-by-word. API keys are saved locally in browser storage.
                </p>
              </div>

              {/* Key fields */}
              <div className="space-y-4">
                
                {/* OpenAI Key */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showOpenaiKey ? 'text' : 'password'}
                      placeholder="sk-proj-..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-850 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      {showOpenaiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Gemini Key */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Google Gemini API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      placeholder="AIzaSy..."
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-850 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      {showGeminiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Google OAuth Client ID */}
                <div className="pt-3 border-t border-slate-800">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Google Client ID (OAuth Login credentials)
                  </label>
                  <input
                    type="text"
                    placeholder="YOUR_CLIENT_ID.apps.googleusercontent.com"
                    value={googleId}
                    onChange={(e) => setGoogleId(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-850 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                  />
                  <p className="text-[8px] text-slate-500 mt-1">
                    Enter your Google Cloud Console Client ID to run secure native logins. Leaves simulated mode automatically when configured.
                  </p>
                </div>

                {/* Integration defaults map */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Default Providers Routing</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-500 mb-1.5">Prompt Option A Provider</label>
                      <select
                        value={provA}
                        onChange={(e: any) => setProvA(e.target.value)}
                        className="w-full px-3 py-2 text-xs text-slate-200 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none"
                      >
                        <option value="mock">Simulated Mock Generator</option>
                        <option value="openai" disabled={!openaiKey}>OpenAI (gpt-4o-mini)</option>
                        <option value="gemini" disabled={!geminiKey}>Google Gemini (gemini-1.5-flash)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-semibold text-slate-500 mb-1.5">Prompt Option B Provider</label>
                      <select
                        value={provB}
                        onChange={(e: any) => setProvB(e.target.value)}
                        className="w-full px-3 py-2 text-xs text-slate-200 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none"
                      >
                        <option value="mock">Simulated Mock Generator</option>
                        <option value="openai" disabled={!openaiKey}>OpenAI (gpt-4o-mini)</option>
                        <option value="gemini" disabled={!geminiKey}>Google Gemini (gemini-1.5-flash)</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              {/* Save Footer button */}
              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#5B8CFF] hover:opacity-95 rounded-xl border border-[#6C63FF]/30 disabled:opacity-50 transition"
                >
                  {saving ? 'Configuring integration...' : 'Save Keys Config'}
                </button>
              </div>
            </form>
          )}

          {/* PREFERENCES / NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <span className="text-xs font-bold text-slate-200 block border-b border-slate-800 pb-2.5">
                Preferences Settings
              </span>

              <div className="space-y-4 pt-1">
                {/* Dark Mode toggle */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/20 border border-slate-850 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Dark Mode</span>
                    <span className="text-[10px] text-slate-500">Enable deep dark theme colors default.</span>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-[10px] text-[#6C63FF] font-bold rounded-lg border border-slate-800"
                  >
                    Active
                  </button>
                </div>

                {/* Notifications setting */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/20 border border-slate-850 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Toast Notifications</span>
                    <span className="text-[10px] text-slate-500">Receive popup warnings and action confirmations.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => {
                      setNotificationsEnabled(e.target.checked);
                      toast.success(e.target.checked ? 'Notifications enabled' : 'Notifications disabled');
                    }}
                    className="w-4 h-4 rounded text-[#6C63FF] focus:ring-[#6C63FF] bg-slate-950 border-slate-850"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {activeTab === 'danger' && (
            <div className="space-y-5">
              <span className="text-xs font-bold text-red-400 block border-b border-slate-800 pb-2.5">
                Danger Zone
              </span>

              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4">
                <ShieldAlert size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-3.5 flex-1">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Delete User Account</span>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Permanently wipe all projects data databases, history logs, API configurations, and close your session credentials. This action cannot be undone.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition"
                  >
                    <Trash2 size={13} />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
export default Settings;
