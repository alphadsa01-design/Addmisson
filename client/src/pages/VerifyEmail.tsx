import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authClient } from '../auth';
import { Mail, ShieldCheck, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await authClient.emailOtp.verifyEmail({
        email,
        otp: code,
      });

      if (res.error) {
        throw new Error(res.error.message || 'Verification failed. Please check the code.');
      }

      if (res.data) {
        const token = (res.data as any).token || (res.data as any).session?.token;
        if (token) {
          localStorage.setItem('token', token);
        }
      }

      setSuccess('Email verified successfully! Redirecting to secure login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Email verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">Verify Your Account</h2>
          <p className="text-xs text-slate-500 font-medium">
            Enter the confirmation code sent to your email address to complete registration.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-650 text-xs rounded-xl flex items-center gap-2.5 font-bold">
            <AlertCircle size={16} />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs rounded-xl flex items-center gap-2.5 font-bold">
            <CheckCircle size={16} />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
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
                placeholder="Enter your registered email"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-650/10 focus:border-slate-650 focus:outline-none transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Confirmation Code / Token
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste the verification token here"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-slate-650/10 focus:border-slate-650 focus:outline-none transition font-bold text-center tracking-widest"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 shadow-md shadow-slate-950/10 disabled:opacity-50"
          >
            {loading ? 'Verifying Account...' : 'Confirm Account Registration'}
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/login')}
            className="text-[10px] text-slate-500 font-bold hover:underline"
          >
            Back to Secure Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
