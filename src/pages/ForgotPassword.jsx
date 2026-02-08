import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import OTPModal from '../components/OTPModal';
import { GraduationCap, Lock } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifiedOtpCode, setVerifiedOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if user exists
      const usersResponse = await api.get(`/users/search?searchTerm=${email}&page=0&size=1`);
      const users = usersResponse.data.content || [];
      
      if (users.length === 0) {
        setError('No account found with this email address');
        setLoading(false);
        return;
      }

      // Normalize email (lowercase and trim) for consistent storage
      const normalizedEmail = email.toLowerCase().trim();
      
      // Send password reset OTP code via email
      const response = await api.post('/auth/send-2fa', { email: normalizedEmail, purpose: 'password-reset' });
      
      if (response.data.success) {
        // Show OTP modal immediately after sending code
        setError(''); // Clear any previous errors
        setCodeSent(true);
        setShowOTP(true);
        // Store the code for development mode (if provided in response)
        if (response.data.code) {
          // Code is available for development/testing
        }
      } else {
        setError(response.data.message || 'Failed to send reset code');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to send reset code. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otpCode) => {
    // Don't verify separately - just store the code and show password fields
    // The code will be verified when resetting the password
    if (otpCode && otpCode.length === 6) {
      setVerifiedOtpCode(otpCode);
      setOtpVerified(true);
      setShowOTP(false);
      setError('');
    } else {
      setError('Please enter a valid 6-digit code');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!verifiedOtpCode) {
      setError('Please verify your email code first');
      return;
    }

    setLoading(true);

    try {
      // Normalize email (lowercase and trim) to match backend normalization
      const normalizedEmail = email.toLowerCase().trim();
      
      // Reset password using the verified OTP code
      const resetResponse = await api.post('/auth/reset-password', {
        email: normalizedEmail,
        code: verifiedOtpCode,
        newPassword: password,
      });

      if (resetResponse.data.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(resetResponse.data.message || 'Failed to reset password');
      }
    } catch (err) {
      // If OTP was already used or expired, try to automatically resend
      if (err.response?.status === 400 && (err.response?.data?.message?.includes('Invalid or expired') || err.response?.data?.message?.includes('expired'))) {
        setError('Verification code has expired. Requesting a new code...');
        
        // Automatically request a new code
        try {
          const normalizedEmail = email.toLowerCase().trim();
          const resendResponse = await api.post('/auth/send-2fa', { email: normalizedEmail, purpose: 'password-reset' });
          if (resendResponse.data.success) {
            setError('A new verification code has been sent. Please enter it again.');
            setOtpVerified(false);
            setVerifiedOtpCode('');
            setShowOTP(true);
            setCodeSent(true);
          } else {
            setError('Verification code has expired. Please request a new code.');
            setOtpVerified(false);
            setVerifiedOtpCode('');
            setShowOTP(false);
            setCodeSent(false);
          }
        } catch (resendErr) {
          setError('Verification code has expired. Please go back and request a new code.');
          setOtpVerified(false);
          setVerifiedOtpCode('');
          setShowOTP(false);
          setCodeSent(false);
        }
      } else {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to reset password';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show success message after password reset
  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. Redirecting to login...
            </p>
            <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If OTP is verified, show password reset form
  if (otpVerified) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Lock className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
              <p className="text-gray-600">Email verified! Enter your new password</p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="input-field bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email verified: {email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  minLength={6}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  minLength={6}
                  placeholder="Confirm new password"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-3 text-lg"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => {
                  setOtpVerified(false);
                  setPassword('');
                  setConfirmPassword('');
                  setVerifiedOtpCode('');
                  setError('');
                  setShowOTP(true);
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Back to Code Entry
              </button>
              <div>
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <GraduationCap className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
            <p className="text-gray-600">Enter your email to receive a password reset code</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {codeSent && !showOTP && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                Verification code has been sent to your email. Please check your inbox.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="Enter your email address"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-3 text-lg"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>

      {showOTP && (
        <OTPModal
          email={email}
          onVerify={handleOTPVerify}
          onClose={() => {
            setShowOTP(false);
            setError('');
            setCodeSent(false);
          }}
          onResend={async () => {
            try {
              setLoading(true);
              // Normalize email for consistent storage
              const normalizedEmail = email.toLowerCase().trim();
              const resendResponse = await api.post('/auth/send-2fa', { email: normalizedEmail, purpose: 'password-reset' });
              if (resendResponse.data.success) {
                setError('');
                setCodeSent(true);
              } else {
                setError('Failed to resend code');
              }
            } catch (err) {
              setError('Failed to resend code');
            } finally {
              setLoading(false);
            }
          }}
          error={error}
        />
      )}
    </div>
  );
};

export default ForgotPassword;

