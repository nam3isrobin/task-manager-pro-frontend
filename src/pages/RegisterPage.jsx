import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, AlertCircle, Loader2, CheckSquare, Eye, EyeOff, Check } from 'lucide-react';
import {
  MAX_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  isValidEmail,
} from '../utils/validation';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [errorShakeKey, setErrorShakeKey] = useState(0);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  // Password strength checklist
  const hasMinLength = password.length >= MIN_PASSWORD_LENGTH;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isStrong = hasMinLength && hasLetter && hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setFormError('Please fill in all required fields');
      setErrorShakeKey((k) => k + 1);
      return;
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      setFormError(`Name cannot exceed ${MAX_NAME_LENGTH} characters`);
      setErrorShakeKey((k) => k + 1);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setFormError('Please enter a valid email address');
      setErrorShakeKey((k) => k + 1);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
      setErrorShakeKey((k) => k + 1);
      return;
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      setFormError(`Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`);
      setErrorShakeKey((k) => k + 1);
      return;
    }

    try {
      const result = await register(trimmedName, trimmedEmail, password);
      if (result.success) {
        // Direct authentication completed; navigate directly to dashboard workspace without OTP verification
        navigate('/');
      } else {
        setFormError(sanitizeErrorMessage(result.error, 'Registration failed. Please try again.'));
        setErrorShakeKey((k) => k + 1);
      }
    } catch (err) {
      setFormError(sanitizeErrorMessage(err, 'Registration failed. Please try again.'));
      setErrorShakeKey((k) => k + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060b18] via-[#0a0f1e] to-[#060b18] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/20 text-slate-900 flex items-center justify-center transition-transform hover:scale-105 duration-200">
            <CheckSquare className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Create an Account
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Join Task Manager Pro and streamline your workspace
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-xl py-6 sm:py-8 px-5 sm:px-10 shadow-2xl rounded-2xl border border-white/10">
          {formError && (
            <div
              key={errorShakeKey}
              className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm flex items-center animate-shake"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={MAX_NAME_LENGTH}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-11 pr-4 min-h-[44px] py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 backdrop-blur-sm transition-all"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            </div>

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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={MAX_PASSWORD_LENGTH}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 min-h-[44px] py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 backdrop-blur-sm transition-all"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:text-amber-400"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password strength requirement helper */}
              {password.length > 0 && (
                <div className="mt-2 text-xs space-y-1 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasMinLength ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-500'}`}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span className={hasMinLength ? 'text-emerald-400' : 'text-slate-500'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasLetter && hasNumber ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-500'}`}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span className={hasLetter && hasNumber ? 'text-emerald-400' : 'text-slate-500'}>
                      Contains letters and numbers
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center min-h-[44px] py-3 px-4 rounded-xl text-sm font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1528]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6 sm:mt-8 text-center pt-5 sm:pt-6 border-t border-white/8">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-amber-400 hover:text-amber-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
