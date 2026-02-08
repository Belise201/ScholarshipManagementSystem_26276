import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import OTPModal from '../components/OTPModal';
import { Lock, GraduationCap } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpEmail, setOtpEmail] = useState(email || '');
  const [codeSent, setCodeSent] = useState(false);

  const navigate = useNavigate();

  const handleOTPVerify = async (otpCode) => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setShowOTP(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setShowOTP(false);
      return;
    }

    if (!otpEmail) {
      setError('Email is required');
      setShowOTP(false);
      return;
    }

    setLoading(true);
    try {
      // Reset password using the dedicated endpoint
      const resetResponse = await api.post('/auth/reset-password', {
        email: otpEmail,
        code: otpCode,
        newPassword: password,
      });

      if (resetResponse.data.success) {
        setSuccess(true);
        setShowOTP(false);
      } else {
        setError(resetResponse.data.message || 'Failed to reset password');
        setShowOTP(false);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to reset password';
      setError(errorMessage);
      setShowOTP(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
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

    if (!otpEmail) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      // Send password reset OTP code
      const response = await api.post('/auth/send-2fa', { email: otpEmail, purpose: 'password-reset' });
      
      if (response.data.success) {
        setCodeSent(true);
        setError(''); // Clear any errors
        setShowOTP(true);
      } else {
        setError(response.data.message || 'Failed to send verification code');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to send verification code. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <GraduationCap className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600">Enter your new password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {codeSent && !showOTP && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                Verification code has been sent to your email. Please check your inbox and enter the code when prompted.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                required
                readOnly={!!email} // Read-only if email comes from URL
                className={`input-field ${email ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="Enter your email"
              />
              {email && (
                <p className="text-xs text-gray-500 mt-1">
                  Email is pre-filled from the reset link
                </p>
              )}
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
                placeholder="Enter new password"
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
              {loading ? 'Sending Code...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>

      {showOTP && (
        <OTPModal
          email={otpEmail}
          onVerify={handleOTPVerify}
          onClose={() => {
            setShowOTP(false);
            setError('');
          }}
          onResend={async () => {
            try {
              await api.post('/auth/send-2fa', { email: otpEmail, purpose: 'password-reset' });
            } catch (err) {
              setError('Failed to resend code');
            }
          }}
        />
      )}
    </div>
  );
};

export default ResetPassword;

