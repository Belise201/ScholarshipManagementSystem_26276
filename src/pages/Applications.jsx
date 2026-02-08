import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Table from '../components/Table';
import Button from '../components/Button';
import { Plus, Eye, CheckCircle, XCircle, FileText, ClipboardCheck } from 'lucide-react';

const Applications = () => {
  const { isAdmin, isApplicant, isReviewer, isFinanceOfficer, user } = useAuth();
  const { addNotification } = useNotifications();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, [currentPage, searchTerm]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: 3,
        sortBy: 'id',
        sortDir: 'asc',
      };

      let response;
      
      // For applicants, only show their own applications
      if (isApplicant() && !isAdmin() && user) {
        // For search, we still need to fetch all and filter client-side since backend doesn't support search for user applications
        // But we'll paginate properly by fetching in chunks
        if (searchTerm) {
          // Fetch first page without search to get total count, then filter client-side for first page
          const userAppsResponse = await api.get(`/applications/user/${user.id}`, { 
            params: { page: 0, size: 100, sortBy: params.sortBy, sortDir: params.sortDir } 
          });
          const allApps = userAppsResponse.data.content || [];
          const filtered = allApps.filter(app => 
            app.scholarship?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.applicationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
          );
          // Apply pagination to filtered results (for first 100 items)
          const start = currentPage * params.size;
          const end = start + params.size;
          setApplications(filtered.slice(start, end));
          // Estimate total pages (could be inaccurate if more than 100 results)
          setTotalPages(Math.ceil(Math.min(filtered.length, 100) / params.size));
          setTotalElements(filtered.length);
        } else {
          // Get user's applications with proper pagination
          const userAppsResponse = await api.get(`/applications/user/${user.id}`, { params });
          setApplications(userAppsResponse.data.content || []);
          setTotalPages(userAppsResponse.data.totalPages || 0);
          setTotalElements(userAppsResponse.data.totalElements || 0);
        }
      } else {
        // Admin sees all applications
        if (searchTerm) {
          response = await api.get('/applications/search', {
            params: { ...params, searchTerm },
          });
        } else {
          response = await api.get('/applications', { params });
        }
        setApplications(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(0);
  };

  const handleApprove = async (applicationId) => {
    if (!window.confirm('Are you sure you want to approve this application?')) {
      return;
    }
    
    try {
      const application = applications.find(app => app.id === applicationId);
      if (!application) {
        alert('Application not found');
        return;
      }

      // Get scholarship amount as default
      const scholarshipAmount = application.scholarship?.amount || 0;
      const defaultAmount = scholarshipAmount > 0 ? scholarshipAmount.toString() : '';
      
      const approvedAmount = prompt(`Enter approved amount (RWF):\n\nScholarship amount: ${scholarshipAmount.toLocaleString()} RWF`, defaultAmount);
      if (!approvedAmount || approvedAmount.trim() === '') {
        return;
      }

      const amount = parseFloat(approvedAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than zero');
        return;
      }
      
      const comments = prompt('Enter approval comments (optional):', 'Application approved by admin');
      
      const response = await api.patch(`/applications/${applicationId}/approve`, null, {
        params: {
          approvedAmount: amount,
          comments: comments || 'Application approved by admin'
        }
      });
      
      // Notify user about approval
      if (application?.applicant) {
        addNotification({
          type: 'success',
          title: 'Application Approved!',
          message: `Your application for "${application.scholarship?.name || 'scholarship'}" has been approved for ${amount.toLocaleString()} RWF.`,
          link: `/applications/${applicationId}`
        });
      }
      
      alert('Application approved successfully!');
      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      const errorMessage = error.response?.data || error.message || 'Unknown error';
      const message = typeof errorMessage === 'string' ? errorMessage : (errorMessage.message || JSON.stringify(errorMessage));
      alert('Failed to approve application: ' + message);
    }
  };

  const handleReview = async (applicationId) => {
    try {
      const scoreInput = prompt('Enter review score (0-100):');
      if (!scoreInput || scoreInput.trim() === '') {
        return;
      }

      const score = parseInt(scoreInput);
      if (isNaN(score) || score < 0 || score > 100) {
        alert('Please enter a valid score between 0 and 100');
        return;
      }
      
      const comments = prompt('Enter review comments:');
      if (!comments || comments.trim() === '') {
        alert('Review comments are required');
        return;
      }
      
      const application = applications.find(app => app.id === applicationId);
      
      await api.patch(`/applications/${applicationId}/review`, null, {
        params: {
          score: score,
          comments: comments
        }
      });
      
      // Notify user about review
      if (application?.applicant) {
        addNotification({
          type: 'info',
          title: 'Application Reviewed',
          message: `Your application for "${application.scholarship?.name || 'scholarship'}" has been reviewed. Check your application for details.`,
          link: `/applications/${applicationId}`
        });
      }
      
      alert('Application reviewed successfully!');
      fetchApplications();
    } catch (error) {
      console.error('Error reviewing application:', error);
      const errorMessage = error.response?.data || error.message || 'Unknown error';
      const message = typeof errorMessage === 'string' ? errorMessage : (errorMessage.message || JSON.stringify(errorMessage));
      alert('Failed to review application: ' + message);
    }
  };

  const handleReject = async (applicationId) => {
    if (!window.confirm('Are you sure you want to reject this application?')) {
      return;
    }
    
    try {
      const comments = prompt('Enter rejection reason:');
      if (!comments) return;
      
      const application = applications.find(app => app.id === applicationId);
      
      await api.patch(`/applications/${applicationId}/reject`, null, {
        params: { comments }
      });
      
      // Notify user about rejection
      if (application?.applicant) {
        addNotification({
          type: 'warning',
          title: 'Application Status Update',
          message: `Your application for "${application.scholarship?.name || 'scholarship'}" has been reviewed. Check your application for details.`,
          link: `/applications/${applicationId}`
        });
      }
      
      alert('Application rejected.');
      fetchApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application: ' + (error.response?.data?.message || error.message));
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
    },
    {
      key: 'applicant',
      label: 'Applicant',
      render: (value, row) => {
        if (row.applicant) {
          return `${row.applicant.firstName} ${row.applicant.lastName}`;
        }
        return 'N/A';
      },
    },
    {
      key: 'scholarship',
      label: 'Scholarship',
      render: (value) => value?.name || 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'APPROVED' ? 'bg-green-100 text-green-700' :
          value === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
          value === 'REJECTED' ? 'bg-red-100 text-red-700' :
          value === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'requestedAmount',
      label: 'Requested Amount',
      render: (value) => value ? `${value.toLocaleString()} RWF` : 'N/A',
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/applications/${row.id}`)}
            className="p-1 text-primary-600 hover:text-primary-700 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {((isAdmin() || isReviewer() || isFinanceOfficer()) && (row.status === 'SUBMITTED' || row.status === 'UNDER_REVIEW' || row.status === 'ADDITIONAL_INFO_REQUIRED')) && (
            <>
              {(isAdmin() || isReviewer()) && row.status === 'SUBMITTED' && !row.reviewScore && (
                <button
                  onClick={() => handleReview(row.id)}
                  className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                  title="Review"
                >
                  <ClipboardCheck className="w-4 h-4" />
                </button>
              )}
              {(isAdmin() || isFinanceOfficer()) && (
                <button
                  onClick={() => handleApprove(row.id)}
                  className="p-1 text-green-600 hover:text-green-700 transition-colors"
                  title="Approve"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              {(isAdmin() || isReviewer()) && (
                <button
                  onClick={() => handleReject(row.id)}
                  className="p-1 text-red-600 hover:text-red-700 transition-colors"
                  title="Reject"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin() ? 'Applications' : 'My Applications'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin() ? 'Manage scholarship applications' : 'Track your scholarship applications'}
          </p>
        </div>
        {!isAdmin() && (
          <Button variant="primary" onClick={() => navigate('/applications/new')}>
            <Plus className="w-4 h-4 mr-2 inline" />
            New Application
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        data={applications}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={3}
        onPageChange={setCurrentPage}
        onSearch={handleSearch}
        searchPlaceholder="Search across all columns (applicant, scholarship, status, amount, date)..."
      />
    </div>
  );
};

export default Applications;

