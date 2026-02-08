import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  CreditCard, 
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Plus
} from 'lucide-react';

const FinanceOfficerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    payments: { total: 0, pending: 0, completed: 0, failed: 0, totalAmount: 0 },
    applications: { approved: 0, pendingPayment: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [approvedApplications, setApprovedApplications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch payment statistics
      try {
        const paymentStats = await api.get('/payments/statistics');
        const statsData = paymentStats.data;
        setStats(prev => ({
          ...prev,
          payments: {
            total: statsData.byStatus?.COMPLETED + statsData.byStatus?.PENDING + statsData.byStatus?.FAILED || 0,
            pending: statsData.byStatus?.PENDING || 0,
            completed: statsData.byStatus?.COMPLETED || 0,
            failed: statsData.byStatus?.FAILED || 0,
            totalAmount: statsData.totalDisbursedAmount || 0,
          },
        }));
      } catch (err) {
        console.error('Error fetching payment statistics:', err);
        // Fallback: fetch payments directly
        try {
          const [allPayments, pendingPayments, completedPayments] = await Promise.all([
            api.get('/payments?page=0&size=1'),
            api.get('/payments/pending?page=0&size=10'),
            api.get('/payments/completed?page=0&size=1'),
          ]);
          const totalAmount = completedPayments.data.content?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
          setStats(prev => ({
            ...prev,
            payments: {
              total: allPayments.data.totalElements || 0,
              pending: pendingPayments.data.totalElements || 0,
              completed: completedPayments.data.totalElements || 0,
              failed: 0,
              totalAmount: totalAmount,
            },
          }));
        } catch (e) {
          console.error('Error fetching payments:', e);
        }
      }

      // Fetch approved applications that might need payments
      try {
        const approvedApps = await api.get('/applications/status/APPROVED?page=0&size=5&sortBy=approvedAt&sortDir=desc');
        setApprovedApplications(approvedApps.data.content || []);
        setStats(prev => ({
          ...prev,
          applications: {
            approved: approvedApps.data.totalElements || 0,
            pendingPayment: 0, // Could calculate this more precisely
          },
        }));
      } catch (err) {
        console.error('Error fetching approved applications:', err);
      }

      // Fetch recent payments
      try {
        const recent = await api.get('/payments?page=0&size=5&sortBy=createdAt&sortDir=desc');
        setRecentPayments(recent.data.content || []);
      } catch (err) {
        console.error('Error fetching recent payments:', err);
      }

      // Fetch pending payments
      try {
        const pending = await api.get('/payments/pending?page=0&size=5&sortBy=createdAt&sortDir=asc');
        setPendingPayments(pending.data.content || []);
      } catch (err) {
        console.error('Error fetching pending payments:', err);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'primary', onClick }) => {
    const colors = {
      primary: 'bg-primary-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    };

    return (
      <div 
        className={`card hover:shadow-lg transition-shadow duration-200 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`${colors[color]} p-4 rounded-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Officer Dashboard</h1>
        <p className="text-gray-600">Manage payments and financial transactions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          title="Total Disbursed"
          value={`${(stats.payments.totalAmount / 1000000).toFixed(1)}M`}
          subtitle={`${stats.payments.totalAmount.toLocaleString()} RWF`}
          color="green"
          onClick={() => navigate('/payments/status/COMPLETED')}
        />
        <StatCard
          icon={Clock}
          title="Pending Payments"
          value={stats.payments.pending}
          subtitle="Awaiting processing"
          color="yellow"
          onClick={() => navigate('/payments/pending')}
        />
        <StatCard
          icon={CheckCircle}
          title="Completed"
          value={stats.payments.completed}
          subtitle="Successfully processed"
          color="green"
          onClick={() => navigate('/payments/completed')}
        />
        <StatCard
          icon={CreditCard}
          title="Total Payments"
          value={stats.payments.total}
          subtitle="All transactions"
          color="primary"
          onClick={() => navigate('/payments')}
        />
      </div>

      {/* Approved Applications Ready for Payment */}
      <div className="card bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Approved Applications Ready for Payment</h2>
            <p className="text-sm text-gray-600 mt-1">Create payments for approved scholarship applications</p>
          </div>
          <button
            onClick={() => navigate('/applications/status/APPROVED')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View All Approved
          </button>
        </div>
        <div className="space-y-3">
          {approvedApplications.length > 0 ? (
            <>
              {approvedApplications.map((app) => (
                <div 
                  key={app.id}
                  className="p-4 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">
                        {app.scholarship?.name || 'Scholarship Application'}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {app.applicant?.firstName} {app.applicant?.lastName}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Application #{app.applicationNumber || app.id}</span>
                        {app.approvedAmount && (
                          <span className="font-semibold text-green-600">
                            {app.approvedAmount.toLocaleString()} RWF Approved
                          </span>
                        )}
                      </div>
                      {app.approvedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Approved: {new Date(app.approvedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        APPROVED
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/payments/new', { state: { applicationId: app.id } });
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors font-medium"
                      >
                        Create Payment
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {stats.applications.approved > approvedApplications.length && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">
                    And {stats.applications.approved - approvedApplications.length} more approved applications
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No approved applications at the moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments - Priority */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Pending Payments</h2>
            <button
              onClick={() => navigate('/payments/pending')}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {pendingPayments.length > 0 ? (
              pendingPayments.map((payment) => (
                <div 
                  key={payment.id}
                  className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/payments/${payment.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">
                        {payment.recipientName || `Application #${payment.application?.id || 'N/A'}`}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mb-1">
                        {payment.amount?.toLocaleString()} RWF
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.method?.replace(/_/g, ' ')} • {payment.type?.replace(/_/g, ' ')}
                      </p>
                      {payment.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{payment.description}</p>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 ml-2">
                      PENDING
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No pending payments</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Payments</h2>
            <button
              onClick={() => navigate('/payments')}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <div 
                  key={payment.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/payments/${payment.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">
                        {payment.recipientName || `Payment #${payment.id}`}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mb-1">
                        {payment.amount?.toLocaleString()} RWF
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      payment.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    } ml-2`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent payments</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/payments/new')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
          >
            <Plus className="w-6 h-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Create Payment</p>
            <p className="text-sm text-gray-600">Create a new payment transaction</p>
          </button>
          <button 
            onClick={() => navigate('/payments/pending')}
            className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors"
          >
            <Clock className="w-6 h-6 text-yellow-600 mb-2" />
            <p className="font-medium text-gray-900">Process Payments</p>
            <p className="text-sm text-gray-600">{stats.payments.pending} pending payments</p>
          </button>
          <button 
            onClick={() => navigate('/applications/status/APPROVED')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
          >
            <CheckCircle className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Approved Applications</p>
            <p className="text-sm text-gray-600">{stats.applications.approved} ready for payment</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinanceOfficerDashboard;

