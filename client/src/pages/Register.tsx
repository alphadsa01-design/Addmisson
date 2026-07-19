import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Briefcase, AlertCircle, Building, ShieldCheck, CheckCircle, ArrowRight } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        email,
        password,
        name,
        designation,
      });

      if (res.data?.status === 'success') {
        setSuccess(`Account registered! Enter the 6-digit OTP verification code.`);
        setShowVerification(true);
      } else {
        throw new Error(res.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyOtp(email, code);
      setSuccess('Email verified successfully! Opening workspace...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Email OTP verification failed.');
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

        {/* Top Accent bar */}
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
            <ShieldCheck size={14} className="text-slate-800" /> OTP Verified Registration
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Register New Operator <br />
            <span className="text-slate-500">With Email Verification</span>
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Create your desk profile and complete 6-digit Email OTP token verification to activate your account.
          </p>

          <div className="pt-4 space-y-3 text-xs text-slate-600 font-semibold">
            <div className="flex items-start gap-3">
              <CheckCircle size={15} className="text-slate-800 shrink-0 mt-0.5" />
              <p>Mandatory 6-Digit Email OTP Verification</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={15} className="text-slate-800 shrink-0 mt-0.5" />
              <p>Node.js Scrypt Security & Encrypted Credentials</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase relative z-10">
          © National Informatics Registry Division. All Rights Reserved.
        </p>
      </div>

      {/* Right Pane - Register / Verify form */}
      <div className="w-full md:w-5/12 bg-white flex flex-col justify-center p-8 sm:p-12">
        <div className="max-w-sm w-full mx-auto space-y-5 animate-fade-in">
          {!showVerification ? (
            <>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Create Desk Account</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Fill in your details below to generate an OTP verification token.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-3">
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="font-semibold">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-250 text-slate-600 text-xs flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
                  <p className="font-semibold">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Shri Mayank Parashar"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 text-slate-900 placeholder-slate-400 transition form-input-focus"
                    />
                  </div>
                </div>

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
                    Designation / Position
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Briefcase size={16} />
                    </span>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Admission Supervisor"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 text-slate-900 placeholder-slate-400 transition form-input-focus"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Secure Password (min 6 chars)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 text-slate-900 placeholder-slate-400 transition form-input-focus"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-slate-900/5 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending OTP Code...' : 'Register & Send OTP Code'}
                  <ArrowRight size={14} />
                </button>
              </form>

              <div className="text-center pt-1 border-t border-slate-100 mt-6">
                <p className="text-xs text-slate-500 mt-4">
                  Already have a login?{' '}
                  <Link to="/login" className="text-slate-900 font-bold hover:underline">
                    Sign In Here
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Confirm OTP Code</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Enter the 6-digit OTP code generated for <span className="font-bold text-slate-700">{email}</span>.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-3">
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="font-semibold">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs flex items-center gap-3">
                  <CheckCircle size={16} className="shrink-0" />
                  <p className="font-semibold">{success}</p>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code (e.g. 482910)"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-mono font-bold text-center tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 text-slate-900 placeholder-slate-350 transition form-input-focus"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-slate-900/5 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying OTP...' : 'Verify OTP & Activate Account'}
                  <ArrowRight size={14} />
                </button>
              </form>

              <div className="text-center pt-2 border-t border-slate-100 mt-4">
                <button
                  onClick={() => { setShowVerification(false); setError(''); }}
                  className="text-xs text-slate-500 font-bold hover:underline"
                >
                  ← Back to Registration Details
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
