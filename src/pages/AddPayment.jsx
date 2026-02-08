import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import { ArrowLeft, Save } from 'lucide-react';

const AddPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);
  const [formData, setFormData] = useState({
    applicationId: '',
    amount: '',
    method: 'BANK_TRANSFER',
    type: 'INITIAL_DISBURSEMENT',
    recipientName: '',
    recipientAccountNumber: '',
    recipientBankName: '',
    recipientBankCode: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    fetchApprovedApplications();
    // Check if applicationId is passed from navigation state
    if (location.state?.applicationId) {
      setFormData(prev => ({
        ...prev,
        applicationId: location.state.applicationId.toString(),
      }));
    }
  }, [location.state]);

  const fetchApprovedApplications = async () => {
    try {
      const response = await api.get('/applications/status/APPROVED?page=0&size=100');
      setApplications(response.data.content || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.applicationId) {
        setError('Please select an application');
        setLoading(false);
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }

      const submissionData = {
        application: { id: parseInt(formData.applicationId) },
        amount: parseFloat(formData.amount),
        method: formData.method,
        type: formData.type,
        // Don't send status - backend sets it automatically
        recipientName: formData.recipientName || null,
        recipientAccountNumber: formData.recipientAccountNumber || null,
        recipientBankName: formData.recipientBankName || null,
        recipientBankCode: formData.recipientBankCode || null,
        description: formData.description || null,
        notes: formData.notes || null,
      };

      const response = await api.post('/payments', submissionData);
      
      if (response.status === 201 || response.data) {
        navigate('/payments');
      } else {
        setError('Failed to create payment. Please try again.');
      }
    } catch (err) {
      console.error('Error creating payment:', err);
      console.error('Error response:', err.response?.data);
      let errorMessage = 'Failed to create payment. Please check all fields and try again.';
      
      // Handle different error response formats
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (Array.isArray(errorData)) {
          // Handle validation errors array
          errorMessage = errorData.map(e => e.defaultMessage || e.message || e).join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money' },
    { value: 'CHECK', label: 'Check' },
    { value: 'CASH', label: 'Cash' },
    { value: 'DIGITAL_WALLET', label: 'Digital Wallet' },
  ];

  const paymentTypes = [
    { value: 'INITIAL_DISBURSEMENT', label: 'Initial Disbursement' },
    { value: 'PARTIAL_PAYMENT', label: 'Partial Payment' },
    { value: 'FINAL_PAYMENT', label: 'Final Payment' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/payments')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Payment</h1>
            <p className="text-gray-600 mt-1">Create a new payment transaction</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Payment Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application <span className="text-red-500">*</span>
            </label>
            <select
              name="applicationId"
              value={formData.applicationId}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="">Select an approved application</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>
                  Application #{app.id} - {app.applicant?.firstName} {app.applicant?.lastName} - {app.approvedAmount?.toLocaleString()} RWF
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (RWF) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="input-field"
                placeholder="Enter payment amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                required
                className="input-field"
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input-field"
            >
              {paymentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Recipient Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Name
            </label>
            <input
              type="text"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter recipient name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                name="recipientAccountNumber"
                value={formData.recipientAccountNumber}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter account number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                name="recipientBankName"
                value={formData.recipientBankName}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter bank name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Code
            </label>
            <input
              type="text"
              name="recipientBankCode"
              value={formData.recipientBankCode}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter bank code"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Additional Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Enter payment description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Enter any additional notes"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/payments')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2 inline" />
                Create Payment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddPayment;

