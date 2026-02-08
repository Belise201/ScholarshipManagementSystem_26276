import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useRoleView } from '../context/RoleViewContext';
import { 
  Users, 
  GraduationCap, 
  FileText, 
  CreditCard, 
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { switchRoleView } = useRoleView();
  const [stats, setStats] = useState({
    users: { total: 0, new: 0 },
    scholarships: { total: 0, open: 0 },
    applications: { total: 0, pending: 0, approved: 0 },
    payments: { total: 0, pending: 0, completed: 0, totalAmount: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, scholarshipsRes, applicationsRes, paymentsRes] = await Promise.allSettled([
        api.get('/users/statistics'),
        api.get('/scholarships/statistics'),
        api.get('/applications/statistics'),
        api.get('/payments/statistics'),
      ]);

      // Users stats
      if (usersRes.status === 'fulfilled') {
        const userStats = usersRes.value.data;
        if (userStats.totalUsers !== undefined) {
          setStats(prev => ({
            ...prev,
            users: {
              total: userStats.totalUsers || 0,
              new: userStats.newUsersThisMonth || 0,
            },
          }));
        } else {
          try {
            const usersList = await api.get('/users?page=0&size=1');
            setStats(prev => ({
              ...prev,
              users: {
                total: usersList.data.totalElements || 0,
                new: 0,
              },
            }));
          } catch (e) {
            console.error('Error fetching users count:', e);
          }
        }
      }

      // Scholarships stats
      if (scholarshipsRes.status === 'fulfilled') {
        const scholarshipStats = scholarshipsRes.value.data;
        if (scholarshipStats.totalScholarships !== undefined) {
          setStats(prev => ({
            ...prev,
            scholarships: {
              total: scholarshipStats.totalScholarships || 0,
              open: scholarshipStats.openScholarships || 0,
            },
          }));
        } else {
          try {
            const [allScholarships, openScholarships] = await Promise.all([
              api.get('/scholarships?page=0&size=1'),
              api.get('/scholarships/open'),
            ]);
            setStats(prev => ({
              ...prev,
              scholarships: {
                total: allScholarships.data.totalElements || allScholarships.data.length || 0,
                open: Array.isArray(openScholarships.data) ? openScholarships.data.length : 0,
              },
            }));
          } catch (e) {
            console.error('Error fetching scholarships count:', e);
          }
        }
      }

      // Applications stats
      if (applicationsRes.status === 'fulfilled') {
        const appStats = applicationsRes.value.data;
        if (appStats.totalApplications !== undefined) {
          setStats(prev => ({
            ...prev,
            applications: {
              total: appStats.totalApplications || 0,
              pending: appStats.pendingApplications || 0,
              approved: appStats.approvedApplications || 0,
            },
          }));
        } else {
          try {
            const [allApps, pendingApps, approvedApps] = await Promise.all([
              api.get('/applications?page=0&size=1'),
              api.get('/applications/pending?page=0&size=1'),
              api.get('/applications/status/APPROVED?page=0&size=1'),
            ]);
            setStats(prev => ({
              ...prev,
              applications: {
                total: allApps.data.totalElements || 0,
                pending: pendingApps.data.totalElements || 0,
                approved: approvedApps.data.totalElements || 0,
              },
            }));
          } catch (e) {
            console.error('Error fetching applications count:', e);
          }
        }
      }

      // Payments stats
      if (paymentsRes.status === 'fulfilled') {
        const paymentStats = paymentsRes.value.data;
        if (paymentStats.totalPayments !== undefined) {
          setStats(prev => ({
            ...prev,
            payments: {
              total: paymentStats.totalPayments || 0,
              pending: paymentStats.pendingPayments || 0,
              completed: paymentStats.completedPayments || 0,
              totalAmount: paymentStats.totalAmountDisbursed || 0,
            },
          }));
        } else {
          try {
            const [allPayments, pendingPayments, completedPayments] = await Promise.all([
              api.get('/payments?page=0&size=1'),
              api.get('/payments/pending?page=0&size=1'),
              api.get('/payments/completed?page=0&size=1'),
            ]);
            const totalAmount = completedPayments.data.content?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
            setStats(prev => ({
              ...prev,
              payments: {
                total: allPayments.data.totalElements || 0,
                pending: pendingPayments.data.totalElements || 0,
                completed: completedPayments.data.totalElements || 0,
                totalAmount: totalAmount,
              },
            }));
          } catch (e) {
            console.error('Error fetching payments count:', e);
          }
        }
      }

      // Fetch recent applications
      try {
        const recentApps = await api.get('/applications?page=0&size=5&sortBy=submittedAt&sortDir=desc');
        setRecentActivity(recentApps.data.content || []);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
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
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage the scholarship management system</p>
      </div>

      {/* Role Selection Card */}
      <div className="mb-6">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 hover:border-green-400 transition-all cursor-pointer max-w-2xl"
          onClick={() => switchRoleView('finance-officer')}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-8 h-8 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Continue as Finance Officer</h2>
              </div>
              <p className="text-gray-700 mb-4">
                View approved applications and process scholarship payments
              </p>
              <div className="flex items-center text-green-600 font-medium">
                Go to Finance Officer Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
            <div className="ml-4">
              <div className="bg-green-500 p-4 rounded-lg">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.users.total}
          subtitle={`${stats.users.new} new this month`}
          color="primary"
          onClick={() => navigate('/users')}
        />
        <StatCard
          icon={GraduationCap}
          title="Scholarships"
          value={stats.scholarships.total}
          subtitle={`${stats.scholarships.open} currently open`}
          color="blue"
          onClick={() => navigate('/scholarships')}
        />
        <StatCard
          icon={FileText}
          title="Applications"
          value={stats.applications.total}
          subtitle={`${stats.applications.pending} pending, ${stats.applications.approved} approved`}
          color="purple"
          onClick={() => navigate('/applications')}
        />
        <StatCard
          icon={CreditCard}
          title="Payments"
          value={stats.payments.completed}
          subtitle={`${stats.payments.totalAmount.toLocaleString()} RWF disbursed`}
          color="green"
          onClick={() => navigate('/payments')}
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-700">Completed</span>
              </div>
              <span className="font-bold text-gray-900">{stats.payments.completed}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-700">Pending</span>
              </div>
              <span className="font-bold text-gray-900">{stats.payments.pending}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Total</span>
              </div>
              <span className="font-bold text-gray-900">{stats.payments.total}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Applications</h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((app) => (
                <div 
                  key={app.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">Application #{app.applicationNumber || app.id}</p>
                    <p className="text-sm text-gray-500">
                      {app.applicant?.firstName} {app.applicant?.lastName} - {app.scholarship?.name || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    app.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    app.status === 'PENDING' || app.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-700' :
                    app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent applications</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/scholarships/new')}
            className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-left transition-colors"
          >
            <Plus className="w-6 h-6 text-primary-600 mb-2" />
            <p className="font-medium text-gray-900">Create Scholarship</p>
            <p className="text-sm text-gray-600">Add a new scholarship program</p>
          </button>
          <button 
            onClick={() => navigate('/applications')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
          >
            <FileText className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">Review Applications</p>
            <p className="text-sm text-gray-600">{stats.applications.pending} pending reviews</p>
          </button>
          <button 
            onClick={() => navigate('/payments')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
          >
            <DollarSign className="w-6 h-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Process Payments</p>
            <p className="text-sm text-gray-600">{stats.payments.pending} pending payments</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

