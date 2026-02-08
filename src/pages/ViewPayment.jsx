import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import { ArrowLeft } from 'lucide-react';

const ViewPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const fetchPayment = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/payments/${id}`);
      setPayment(response.data);
    } catch (err) {
      console.error('Error fetching payment:', err);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Payment not found'}
        </div>
        <Button variant="secondary" onClick={() => navigate('/payments')}>
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          Back to Payments
        </Button>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Payment #{payment.id}</h1>
            <p className="text-gray-600 mt-1">Payment Details</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
          payment.status === 'FAILED' ? 'bg-red-100 text-red-700' :
          payment.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {payment.status || 'N/A'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Information */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="mt-1 text-gray-900 font-semibold text-2xl">
                    {payment.amount ? `${payment.amount.toLocaleString()} RWF` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Reference</label>
                  <p className="mt-1 text-gray-900 font-mono">{payment.paymentReference || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Method</label>
                  <p className="mt-1 text-gray-900">
                    {payment.method ? payment.method.replace(/_/g, ' ') : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Type</label>
                  <p className="mt-1 text-gray-900">
                    {payment.type ? payment.type.replace(/_/g, ' ') : 'N/A'}
                  </p>
                </div>
              </div>
              {payment.transactionReference && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction Reference</label>
                  <p className="mt-1 text-gray-900 font-mono">{payment.transactionReference}</p>
                </div>
              )}
              {payment.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-gray-900">{payment.description}</p>
                </div>
              )}
              {payment.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{payment.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Application Information */}
          {payment.application && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Related Application</h2>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Application ID</label>
                  <p className="mt-1 text-gray-900">#{payment.application.id}</p>
                </div>
                {payment.application.applicant && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Applicant</label>
                    <p className="mt-1 text-gray-900">
                      {payment.application.applicant.firstName} {payment.application.applicant.lastName}
                    </p>
                  </div>
                )}
                {payment.application.scholarship && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Scholarship</label>
                    <p className="mt-1 text-gray-900">{payment.application.scholarship.name}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recipient Information */}
          {(payment.recipientName || payment.recipientAccountNumber) && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recipient Information</h2>
              <div className="space-y-3 text-sm">
                {payment.recipientName && (
                  <div>
                    <span className="text-gray-500">Name</span>
                    <p className="text-gray-900">{payment.recipientName}</p>
                  </div>
                )}
                {payment.recipientAccountNumber && (
                  <div>
                    <span className="text-gray-500">Account Number</span>
                    <p className="text-gray-900 font-mono">{payment.recipientAccountNumber}</p>
                  </div>
                )}
                {payment.recipientBankName && (
                  <div>
                    <span className="text-gray-500">Bank Name</span>
                    <p className="text-gray-900">{payment.recipientBankName}</p>
                  </div>
                )}
                {payment.recipientBankCode && (
                  <div>
                    <span className="text-gray-500">Bank Code</span>
                    <p className="text-gray-900">{payment.recipientBankCode}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-3 text-sm">
              {payment.createdAt && (
                <div>
                  <span className="text-gray-500">Created</span>
                  <p className="text-gray-900">
                    {new Date(payment.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
              {payment.scheduledDate && (
                <div>
                  <span className="text-gray-500">Scheduled</span>
                  <p className="text-gray-900">
                    {new Date(payment.scheduledDate).toLocaleString()}
                  </p>
                </div>
              )}
              {payment.processedDate && (
                <div>
                  <span className="text-gray-500">Processed</span>
                  <p className="text-gray-900">
                    {new Date(payment.processedDate).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPayment;

