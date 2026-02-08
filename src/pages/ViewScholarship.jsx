import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Button from '../components/Button';
import { ArrowLeft, Edit, Trash2, Send, CheckCircle } from 'lucide-react';

const ViewScholarship = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const { addNotification } = useNotifications();
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    fetchScholarship();
    if (user && !isAdmin()) {
      checkIfApplied();
    }
  }, [id, user]);

  const fetchScholarship = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/scholarships/${id}`);
      setScholarship(response.data);
    } catch (err) {
      console.error('Error fetching scholarship:', err);
      setError('Failed to load scholarship details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    if (!user || !scholarship) return;
    try {
      const response = await api.get(`/applications/user/${user.id}`);
      const applications = Array.isArray(response.data) 
        ? response.data 
        : (response.data.content || []);
      const applied = applications.some(app => 
        app.scholarship?.id === scholarship.id || app.scholarship?.id === parseInt(id)
      );
      setHasApplied(applied);
    } catch (err) {
      console.error('Error checking application status:', err);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (hasApplied) {
      setError('You have already applied for this scholarship');
      return;
    }

    setIsApplying(true);
    setError('');
    
    try {
      // Navigate to application form with scholarship pre-selected
      navigate(`/applications/new?scholarshipId=${id}`);
    } catch (err) {
      console.error('Error applying:', err);
      setError('Failed to start application. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this scholarship?')) {
      return;
    }

    try {
      await api.delete(`/scholarships/${id}`);
      navigate('/scholarships');
    } catch (err) {
      console.error('Error deleting scholarship:', err);
      alert('Failed to delete scholarship');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !scholarship) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Scholarship not found'}
        </div>
        <Button variant="secondary" onClick={() => navigate('/scholarships')}>
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          Back to Scholarships
        </Button>
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/scholarships')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{scholarship.name}</h1>
            <p className="text-gray-600 mt-1">Scholarship Details</p>
          </div>
        </div>
        {isAdmin() && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => navigate(`/scholarships/${id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2 inline" />
              Edit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2 inline" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-900">{scholarship.description || 'N/A'}</p>
              </div>
              
              {/* Apply Button for Applicants */}
              {!isAdmin() && (scholarship.status === 'OPEN' || scholarship.status === 'PUBLISHED') && (
                <div className="pt-4 border-t">
                  {hasApplied ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">You have applied for this scholarship</p>
                        <p className="text-sm text-green-700">Check your applications to track the status</p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => navigate('/applications')}
                        className="ml-auto"
                      >
                        View My Applications
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Button
                        variant="primary"
                        onClick={handleApply}
                        disabled={isApplying}
                        className="w-full"
                      >
                        {isApplying ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2 inline" />
                            Apply for This Scholarship
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="mt-1 text-gray-900 font-semibold">
                    {scholarship.amount ? `${scholarship.amount.toLocaleString()} RWF` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="mt-1 text-gray-900">
                    {scholarship.type ? scholarship.type.replace(/_/g, ' ') : 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    scholarship.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                    scholarship.status === 'PUBLISHED' ? 'bg-blue-100 text-blue-700' :
                    scholarship.status === 'CLOSED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {scholarship.status || 'N/A'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Important Dates</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Application Deadline</label>
                <p className="mt-1 text-gray-900">
                  {scholarship.applicationDeadline ? new Date(scholarship.applicationDeadline).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Start Date</label>
                <p className="mt-1 text-gray-900">
                  {scholarship.startDate ? new Date(scholarship.startDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">End Date</label>
                <p className="mt-1 text-gray-900">
                  {scholarship.endDate ? new Date(scholarship.endDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Eligibility & Requirements */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Eligibility & Requirements</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Eligibility Criteria</label>
                <p className="mt-1 text-gray-900">{scholarship.eligibilityCriteria || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Required Documents</label>
                <p className="mt-1 text-gray-900">{scholarship.requiredDocuments || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Minimum GPA</label>
                  <p className="mt-1 text-gray-900">{scholarship.minimumGpa || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Max Family Income</label>
                  <p className="mt-1 text-gray-900">
                    {scholarship.maximumFamilyIncome ? `${scholarship.maximumFamilyIncome.toLocaleString()} RWF` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Target Education Level</label>
                  <p className="mt-1 text-gray-900">
                    {scholarship.targetEducationLevel ? scholarship.targetEducationLevel.replace(/_/g, ' ') : 'Any'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Capacity</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Maximum Applicants</label>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {scholarship.maxApplicants || 'Unlimited'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Selected Applicants</label>
                <p className="mt-1 text-2xl font-bold text-primary-600">
                  {scholarship.selectedApplicants || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">
                  {scholarship.createdAt ? new Date(scholarship.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-900">
                  {scholarship.updatedAt ? new Date(scholarship.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewScholarship;

