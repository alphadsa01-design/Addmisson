import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Building, AlertCircle, ShieldCheck, CheckCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans text-slate-900">
      {/* Left Pane - Government Portal branding (Hero Section) */}
      <div className="w-full md:w-7/12 bg-slate-50 border-r border-slate-200 flex flex-col justify-between p-8 sm:p-12 relative overflow-hidden">
        {/* Ashoka Chakra background watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <svg className="w-[500px] h-[500px] animate-spin" style={{ animationDuration: '60s' }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
            {[...Array(24)].map((_, i) => (
              <line
                key={i}
                x1="50"
                y1="50"
                x2={50 + 45 * Math.cos((i * 15 * Math.PI) / 180)}
                y2={50 + 45 * Math.sin((i * 15 * Math.PI) / 180)}
                stroke="currentColor"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>

        {/* Top Monochrome Accent bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>

        {/* Top Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-white border border-slate-200 rounded-xl text-slate-800 shadow-sm">
            <Building size={24} />
          </div>
          <div>
            <h1 className="text-xs font-extrabold tracking-widest text-slate-800 uppercase">
              Ministry of Skill Development
            </h1>
            <p className="text-[10px] font-semibold text-slate-500">Government of India</p>
          </div>
        </div>

        {/* Core Message */}
        <div className="my-16 max-w-xl space-y-5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200/50 border border-slate-350 text-slate-700 rounded-full text-xs font-bold">
            <ShieldCheck size={14} className="text-slate-800" /> Secure Desk Interface
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            ITI Internal Admission <br />
            <span className="text-slate-500">Management Portal</span>
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Authorized staff registry portal for recording admissions, verifying certificate metadata, checking audit files, and generating official acknowledgement receipts.
          </p>

          <div className="pt-4 space-y-3 text-xs text-slate-600 font-semibold">
            <div className="flex items-start gap-3">
              <CheckCircle size={15} className="text-slate-800 shrink-0 mt-0.5" />
              <p>Node.js Crypto Scrypt Password Hashing Policy</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={15} className="text-slate-800 shrink-0 mt-0.5" />
              <p>Complete Audit Trail of Admissions & Registry Operations</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={15} className="text-slate-800 shrink-0 mt-0.5" />
              <p>Unified Operator Access & Desk Management</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase relative z-10">
          © National Informatics Registry Division. All Rights Reserved.
        </p>
      </div>

      {/* Right Pane - Login form */}
      <div className="w-full md:w-5/12 bg-white flex flex-col justify-center p-8 sm:p-12">
        <div className="max-w-sm w-full mx-auto space-y-6 animate-fade-in">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Staff Sign In</h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Enter your credentials below to access the registry desk.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@iti.gov.in"
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 text-slate-900 placeholder-slate-400 transition form-input-focus"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Access Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 text-slate-900 placeholder-slate-400 transition form-input-focus"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-slate-900/5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Authenticating Securely...' : 'Sign In to Desk'}
            </button>
          </form>

          {/* Access-only notice */}
          <div className="text-center pt-4 border-t border-slate-100 mt-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Authorized Portal Access Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
