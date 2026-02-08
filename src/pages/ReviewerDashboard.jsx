import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  FileText, 
  CheckCircle,
  Clock,
  XCircle,
  Search,
  UserCheck
} from 'lucide-react';

const ReviewerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    applications: { 
      total: 0, 
      pending: 0, 
      underReview: 0, 
      reviewed: 0,
      approved: 0,
      rejected: 0
    },
  });
  const [loading, setLoading] = useState(true);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch application statistics
      try {
        const appStats = await api.get('/applications/statistics');
        const statsData = appStats.data;
        setStats(prev => ({
          ...prev,
          applications: {
            total: statsData.totalApplications || 0,
            pending: statsData.pendingApplications || 0,
            underReview: statsData.underReviewApplications || 0,
            reviewed: 0,
            approved: statsData.approvedApplications || 0,
            rejected: statsData.rejectedApplications || 0,
          },
        }));
      } catch (err) {
        console.error('Error fetching application statistics:', err);
        // Fallback: fetch applications directly
        try {
          const [allApps, pendingApps, underReviewApps, approvedApps, rejectedApps] = await Promise.all([
            api.get('/applications?page=0&size=1'),
            api.get('/applications/pending?page=0&size=1'),
            api.get('/applications/status/UNDER_REVIEW?page=0&size=1'),
            api.get('/applications/status/APPROVED?page=0&size=1'),
            api.get('/applications/status/REJECTED?page=0&size=1'),
          ]);
          setStats(prev => ({
            ...prev,
            applications: {
              total: allApps.data.totalElements || 0,
              pending: pendingApps.data.totalElements || 0,
              underReview: underReviewApps.data.totalElements || 0,
              reviewed: 0,
              approved: approvedApps.data.totalElements || 0,
              rejected: rejectedApps.data.totalElements || 0,
            },
          }));
        } catch (e) {
          console.error('Error fetching applications:', e);
        }
      }

      // Fetch pending applications for review
      try {
        const pending = await api.get('/applications/pending?page=0&size=5&sortBy=submittedAt&sortDir=asc');
        setPendingApplications(pending.data.content || []);
      } catch (err) {
        console.error('Error fetching pending applications:', err);
      }

      // Fetch recent applications
      try {
        const recent = await api.get('/applications?page=0&size=5&sortBy=submittedAt&sortDir=desc');
        setRecentApplications(recent.data.content || []);
      } catch (err) {
        console.error('Error fetching recent applications:', err);
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
      purple: 'bg-purple-500',
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviewer Dashboard</h1>
        <p className="text-gray-600">Review and evaluate scholarship applications</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Clock}
          title="Pending Review"
          value={stats.applications.pending}
          subtitle="Awaiting review"
          color="yellow"
          onClick={() => navigate('/applications/pending')}
        />
        <StatCard
          icon={FileText}
          title="Under Review"
          value={stats.applications.underReview}
          subtitle="Currently reviewing"
          color="blue"
          onClick={() => navigate('/applications/status/UNDER_REVIEW')}
        />
        <StatCard
          icon={CheckCircle}
          title="Approved"
          value={stats.applications.approved}
          subtitle="Successfully approved"
          color="green"
          onClick={() => navigate('/applications/status/APPROVED')}
        />
        <StatCard
          icon={FileText}
          title="Total Applications"
          value={stats.applications.total}
          subtitle="All applications"
          color="primary"
          onClick={() => navigate('/applications')}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Applications - Priority */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Pending Review</h2>
            <button
              onClick={() => navigate('/applications/pending')}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {pendingApplications.length > 0 ? (
              pendingApplications.map((app) => (
                <div 
                  key={app.id}
                  className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 cursor-pointer transition-colors"
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
                      <p className="text-sm text-gray-500">
                        Application #{app.applicationNumber || app.id}
                      </p>
                      {app.requestedAmount && (
                        <p className="text-xs text-gray-500 mt-1">
                          Requested: {app.requestedAmount.toLocaleString()} RWF
                        </p>
                      )}
                      {app.submittedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Submitted: {new Date(app.submittedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 ml-2">
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No pending applications</p>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Applications</h2>
            <button
              onClick={() => navigate('/applications')}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentApplications.length > 0 ? (
              recentApplications.map((app) => (
                <div 
                  key={app.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">
                        {app.scholarship?.name || 'Application'}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {app.applicant?.firstName} {app.applicant?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(app.submittedAt || app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      app.status === 'PENDING' || app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-700' :
                      app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    } ml-2`}>
                      {app.status}
                    </span>
                  </div>
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
            onClick={() => navigate('/applications/pending')}
            className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors"
          >
            <Clock className="w-6 h-6 text-yellow-600 mb-2" />
            <p className="font-medium text-gray-900">Review Pending</p>
            <p className="text-sm text-gray-600">{stats.applications.pending} applications waiting</p>
          </button>
          <button 
            onClick={() => navigate('/applications/status/UNDER_REVIEW')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
          >
            <FileText className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Under Review</p>
            <p className="text-sm text-gray-600">{stats.applications.underReview} in progress</p>
          </button>
          <button 
            onClick={() => navigate('/applications')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
          >
            <Search className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">View All</p>
            <p className="text-sm text-gray-600">Browse all applications</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewerDashboard;

