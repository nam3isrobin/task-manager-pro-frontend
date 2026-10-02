import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, AlertCircle, CheckCircle, CheckSquare, Loader2, ArrowLeft } from 'lucide-react';
import { MAX_EMAIL_LENGTH, isValidEmail } from '../utils/validation';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorShakeKey, setErrorShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address');
      setErrorShakeKey((k) => k + 1);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      setErrorShakeKey((k) => k + 1);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email: trimmedEmail });
      setMessage(
        response.data?.message ||
          'If an account exists with that email, instructions have been dispatched.'
      );
    } catch (err) {
      setError(
        sanitizeErrorMessage(
          err,
          'If an account exists with that email, instructions have been dispatched.'
        )
      );
      setErrorShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060b18] via-[#0a0f1e] to-[#060b18] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/20 text-slate-900 flex items-center justify-center transition-transform hover:scale-105 duration-200">
            <CheckSquare className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Reset your password
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your email and we'll send reset instructions
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-xl py-6 sm:py-8 px-5 sm:px-10 shadow-2xl rounded-2xl border border-white/10">
          {error && (
            <div
              key={errorShakeKey}
              className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm flex items-center animate-shake"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-4 text-sm flex items-center">
              <CheckCircle className="w-5 h-5 mr-3 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  maxLength={MAX_EMAIL_LENGTH}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 min-h-[44px] py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 backdrop-blur-sm transition-all"
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center min-h-[44px] py-3 px-4 rounded-xl text-sm font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1528]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Instructions'}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center pt-5 sm:pt-6 border-t border-white/8">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

