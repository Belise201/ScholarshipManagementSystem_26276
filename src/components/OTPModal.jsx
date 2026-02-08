import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const OTPModal = ({ email, otpCode, onVerify, onClose, onResend, error: externalError }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [showDevCode, setShowDevCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  // Update error when external error changes
  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  // Auto-fill OTP if provided (development mode)
  useEffect(() => {
    if (otpCode && otpCode.length === 6) {
      const codeArray = otpCode.split('');
      setOtp(codeArray);
      setShowDevCode(true);
    }
  }, [otpCode]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setOtp(newOtp);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setError(''); // Clear previous errors
    setVerifying(true);
    try {
      await onVerify(otpString);
    } catch (err) {
      // Error is handled in parent component
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setTimer(60);
    setOtp(['', '', '', '', '', '']);
    setError('');
    if (onResend) {
      await onResend();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-600 mb-2">
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </p>
        {showDevCode && otpCode && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium mb-1">
              ⚠️ Development Mode: Email may not be configured
            </p>
            <p className="text-xs text-yellow-700">
              Check your backend console for the OTP code, or use the code below:
            </p>
            <p className="text-lg font-bold text-yellow-900 mt-2 text-center">
              {otpCode}
            </p>
            <p className="text-xs text-yellow-600 mt-2 text-center">
              (Also check your email spam folder)
            </p>
          </div>
        )}

        <div className="flex justify-center space-x-2 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="text-sm font-medium text-center">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={verifying}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {verifying ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </button>

        <div className="text-center">
          {timer > 0 ? (
            <p className="text-sm text-gray-500">
              Resend code in <span className="font-semibold">{timer}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPModal;

