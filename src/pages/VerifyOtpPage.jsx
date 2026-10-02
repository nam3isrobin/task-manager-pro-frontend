import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, AlertCircle, Loader2, CheckCircle, ShieldCheck, RotateCcw, Clock, ArrowLeft, KeyRound } from 'lucide-react';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [approvalState, setApprovalState] = useState(null); // 'pending' | 'approved' | 'rejected'
  const [rejectionReason, setRejectionReason] = useState('');

  const inputRefs = useRef([]);
  const { verifyOtp, resendOtp, isDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isDemo) {
      navigate('/');
      return;
    }

    const passedEmail = location.state?.email || sessionStorage.getItem('taskmanager_verify_email');
    if (passedEmail) {
      setEmail(passedEmail);
      try {
        sessionStorage.setItem('taskmanager_verify_email', passedEmail);
      } catch {}
    }

    // Auto-focus first digit box
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [location, isDemo, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/[^0-9]/g, '');
    if (!cleanVal && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = cleanVal.slice(-1); // Take latest single digit
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);

    // Focus on the slot after the last pasted digit
    const nextIdx = Math.min(digits.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    setError('');
    const otpCode = otp.join('');

    if (otpCode.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (!email) {
      setError('Missing email address. Please return to the registration page.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyOtp(email, otpCode);
      if (result.success) {
        if (result.approvalStatus === 'approved') {
          setSuccessMsg('Verification successful! Access granted.');
          setTimeout(() => navigate('/'), 1200);
        } else if (result.approvalStatus === 'rejected') {
          setApprovalState('rejected');
          setRejectionReason(result.user?.rejectionReason || 'Access request was declined by the administrator.');
        } else {
          // Pending admin approval
          setApprovalState('pending');
        }
      } else {
        setError(sanitizeErrorMessage(result.error, 'Invalid code. Please try again.'));
      }
    } catch (err) {
      setError(sanitizeErrorMessage(err, 'Verification failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setError('');
    setSuccessMsg('');
    setIsResending(true);

    try {
      const result = await resendOtp(email);
      if (result.success) {
        setSuccessMsg(result.message || 'New code sent to your email.');
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(sanitizeErrorMessage(result.error, 'Failed to resend code.'));
      }
    } catch (err) {
      setError(sanitizeErrorMessage(err, 'Failed to resend code.'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060b18] via-[#0a0f1e] to-[#060b18] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/20 text-slate-900 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Security Verification
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter the 6-digit passcode sent to <br />
          <span className="text-amber-400 font-semibold">{email || 'your email'}</span>
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-xl py-6 sm:py-8 px-5 sm:px-10 shadow-2xl rounded-2xl border border-white/10">
          {/* Status Alert Messages */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm flex items-center animate-shake">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-4 text-sm flex items-center animate-fade-in">
              <CheckCircle className="w-5 h-5 mr-3 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Pending Approval Screen */}
          {approvalState === 'pending' ? (
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">Email Verified! Awaiting Approval</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Your email has been confirmed. In accordance with enterprise governance, your account has been placed in the queue for <strong>Administrator Review</strong>.
              </p>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                You will receive an automated email notification once the Administrator accepts or declines your request.
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : approvalState === 'rejected' ? (
            /* Rejected Account Screen */
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-red-400">Account Access Declined</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                The workspace administrator reviewed your registration request and decided not to grant access.
              </p>
              {rejectionReason && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 text-left">
                  <strong>Reason:</strong> {rejectionReason}
                </div>
              )}
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* OTP Input Form */
            <form onSubmit={handleVerify} className="space-y-6">
              {/* 6 Digit Input Boxes */}
              <div className="flex justify-between items-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 sm:w-12 h-14 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono text-white bg-white/5 border border-white/15 focus:border-amber-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all shadow-inner"
                  />
                ))}
              </div>

              {/* Demo Mode helper */}
              {isDemo && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center space-x-1.5">
                    <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Demo Code: <strong className="font-mono text-white">123456</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtp(['1', '2', '3', '4', '5', '6'])}
                    className="underline text-[11px] hover:text-white font-semibold"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {/* Submit Verification Button */}
              <button
                type="submit"
                disabled={isSubmitting || otp.join('').length < 6}
                className="w-full flex justify-center items-center min-h-[44px] py-3 px-4 rounded-xl text-sm font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Passcode'}
              </button>

              {/* Resend Passcode Action */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400">
                <span>Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || isResending}
                  className="font-semibold text-amber-400 hover:text-amber-300 disabled:text-slate-500 transition-colors inline-flex items-center"
                >
                  {isResending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    <>
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Resend Code
                    </>
                  )}
                </button>
              </div>

              {/* Back to sign in */}
              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
