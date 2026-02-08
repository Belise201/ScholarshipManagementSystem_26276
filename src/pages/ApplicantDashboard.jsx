import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  GraduationCap, 
  FileText, 
  CheckCircle,
  Clock,
  XCircle,
  Search,
  CreditCard,
  User
} from 'lucide-react';

const ApplicantDashboard = () => {
  const navigate = useNavigate();
  const [myApplications, setMyApplications] = useState([]);
  const [openScholarships, setOpenScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    openScholarships: 0,
    payments: { pending: 0, completed: 0 },
  });
  const [myPayments, setMyPayments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch user's applications
      try {
        const appsResponse = await api.get('/applications?page=0&size=5&sortBy=submittedAt&sortDir=desc');
        const allApps = appsResponse.data.content || [];
        setMyApplications(allApps);
        
        // Calculate stats
        const pending = allApps.filter(app => app.status === 'PENDING' || app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW').length;
        const approved = allApps.filter(app => app.status === 'APPROVED').length;
        const rejected = allApps.filter(app => app.status === 'REJECTED').length;
        
        setStats(prev => ({
          totalApplications: allApps.length,
          pending,
          approved,
          rejected,
          openScholarships: prev.openScholarships, // Will be updated below
          payments: prev.payments,
        }));

        // Fetch payments for approved applications
        const approvedAppIds = allApps.filter(app => app.status === 'APPROVED').map(app => app.id);
        if (approvedAppIds.length > 0) {
          try {
            const allPayments = [];
            for (const appId of approvedAppIds) {
              try {
                const paymentsRes = await api.get(`/payments/application/${appId}?page=0&size=10`);
                if (paymentsRes.data.content) {
                  allPayments.push(...paymentsRes.data.content);
                }
              } catch (err) {
                console.error(`Error fetching payments for application ${appId}:`, err);
              }
            }
            
            const pendingPayments = allPayments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING' || p.status === 'SCHEDULED');
            const completedPayments = allPayments.filter(p => p.status === 'COMPLETED');
            
            setMyPayments(allPayments.slice(0, 5)); // Show first 5
            setStats(prev => ({
              ...prev,
              payments: {
                pending: pendingPayments.length,
                completed: completedPayments.length,
              },
            }));
          } catch (err) {
            console.error('Error fetching payments:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
      }

      // Fetch open scholarships
      try {
        const scholarshipsResponse = await api.get('/scholarships/open');
        const openSchols = Array.isArray(scholarshipsResponse.data) 
          ? scholarshipsResponse.data 
          : (scholarshipsResponse.data.content || []);
        setOpenScholarships(openSchols.slice(0, 5)); // Show first 5
        setStats(prev => ({
          ...prev,
          openScholarships: openSchols.length,
        }));
      } catch (err) {
        console.error('Error fetching open scholarships:', err);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
        <p className="text-gray-600">Track your scholarship applications</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FileText}
          title="My Applications"
          value={stats.totalApplications}
          subtitle="Total submitted"
          color="primary"
          onClick={() => navigate('/applications')}
        />
        <StatCard
          icon={Clock}
          title="Pending"
          value={stats.pending}
          subtitle="Under review"
          color="yellow"
          onClick={() => navigate('/applications')}
        />
        <StatCard
          icon={CheckCircle}
          title="Approved"
          value={stats.approved}
          subtitle="Congratulations!"
          color="green"
          onClick={() => navigate('/applications')}
        />
        <StatCard
          icon={GraduationCap}
          title="Open Scholarships"
          value={stats.openScholarships}
          subtitle="Available now"
          color="blue"
          onClick={() => navigate('/scholarships')}
        />
        {stats.approved > 0 && (
          <StatCard
            icon={CreditCard}
            title="Payments"
            value={stats.payments.completed}
            subtitle={`${stats.payments.pending} pending`}
            color="green"
            onClick={() => navigate('/payments')}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Scholarships */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Available Scholarships</h2>
            <button
              onClick={() => navigate('/scholarships')}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {openScholarships.length > 0 ? (
              openScholarships.map((scholarship) => (
                <div 
                  key={scholarship.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/scholarships/${scholarship.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{scholarship.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {scholarship.description || 'No description available'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{scholarship.amount?.toLocaleString()} RWF</span>
                        <span>Deadline: {scholarship.applicationDeadline ? new Date(scholarship.applicationDeadline).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 ml-2">
                      OPEN
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No open scholarships available</p>
            )}
          </div>
        </div>

        {/* My Applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">My Applications</h2>
            <button
              onClick={() => navigate('/applications')}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {myApplications.length > 0 ? (
              myApplications.map((app) => (
                <div 
                  key={app.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {app.scholarship?.name || 'Scholarship Application'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Application #{app.applicationNumber || app.id}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Submitted: {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}</span>
                        {app.requestedAmount && (
                          <span>{app.requestedAmount.toLocaleString()} RWF</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)} ml-2`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">You haven't applied for any scholarships yet</p>
                <button
                  onClick={() => navigate('/scholarships')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Browse Scholarships
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Status - Only show if user has approved applications */}
      {stats.approved > 0 && myPayments.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Payment Status</h2>
            <button
              onClick={() => navigate('/payments')}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View All Payments
            </button>
          </div>
          <div className="space-y-3">
            {myPayments.map((payment) => (
              <div 
                key={payment.id}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => navigate(`/payments/${payment.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">
                      Payment #{payment.paymentReference || payment.id}
                    </p>
                    <p className="text-lg font-bold text-gray-900 mb-1">
                      {payment.amount?.toLocaleString()} RWF
                    </p>
                    {payment.application?.scholarship && (
                      <p className="text-sm text-gray-600 mb-1">
                        {payment.application.scholarship.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    payment.status === 'PENDING' || payment.status === 'PROCESSING' || payment.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-700' :
                    payment.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  } ml-2`}>
                    {payment.status === 'COMPLETED' ? '✓ Paid' : payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/profile')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
          >
            <User className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">View Profile</p>
            <p className="text-sm text-gray-600">View your profile and location information</p>
          </button>
          <button 
            onClick={() => navigate('/scholarships')}
            className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-left transition-colors"
          >
            <Search className="w-6 h-6 text-primary-600 mb-2" />
            <p className="font-medium text-gray-900">Browse Scholarships</p>
            <p className="text-sm text-gray-600">Find and apply for available scholarships</p>
          </button>
          <button 
            onClick={() => navigate('/applications')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
          >
            <FileText className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">My Applications</p>
            <p className="text-sm text-gray-600">Track your application status</p>
          </button>
          {stats.approved > 0 && (
            <button 
              onClick={() => navigate('/payments')}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
            >
              <CreditCard className="w-6 h-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Payment Status</p>
              <p className="text-sm text-gray-600">View your payment information</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantDashboard;

