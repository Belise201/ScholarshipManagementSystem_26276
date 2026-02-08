import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import { ArrowLeft } from 'lucide-react';

const ViewApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/applications/${id}`);
      setApplication(response.data);
    } catch (err) {
      console.error('Error fetching application:', err);
      setError('Failed to load application details');
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

  if (error || !application) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Application not found'}
        </div>
        <Button variant="secondary" onClick={() => navigate('/applications')}>
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          Back to Applications
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/applications')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application #{application.id}</h1>
            <p className="text-gray-600 mt-1">Application Details</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          application.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
          application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
          application.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
          application.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {application.status || 'N/A'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Application Information */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Application Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Applicant</label>
                  <p className="mt-1 text-gray-900">
                    {application.applicant ? `${application.applicant.firstName} ${application.applicant.lastName}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Scholarship</label>
                  <p className="mt-1 text-gray-900">{application.scholarship?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Requested Amount</label>
                  <p className="mt-1 text-gray-900 font-semibold">
                    {application.requestedAmount ? `${application.requestedAmount.toLocaleString()} RWF` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Approved Amount</label>
                  <p className="mt-1 text-gray-900 font-semibold text-green-600">
                    {application.approvedAmount ? `${application.approvedAmount.toLocaleString()} RWF` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Statement */}
          {application.personalStatement && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Statement</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{application.personalStatement}</p>
            </div>
          )}

          {/* Academic Achievements */}
          {application.academicAchievements && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Academic Achievements</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{application.academicAchievements}</p>
            </div>
          )}

          {/* Extracurricular Activities */}
          {application.extracurricularActivities && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Extracurricular Activities</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{application.extracurricularActivities}</p>
            </div>
          )}

          {/* Work Experience */}
          {application.workExperience && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Work Experience</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{application.workExperience}</p>
            </div>
          )}

          {/* Financial Need Statement */}
          {application.financialNeedStatement && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Need Statement</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{application.financialNeedStatement}</p>
            </div>
          )}

          {/* Review Information */}
          {(application.reviewScore || application.reviewComments) && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Review Information</h2>
              <div className="space-y-4">
                {application.reviewScore && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Review Score</label>
                    <p className="mt-1 text-gray-900 font-semibold">{application.reviewScore}/100</p>
                  </div>
                )}
                {application.reviewComments && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Review Comments</label>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap">{application.reviewComments}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-3 text-sm">
              {application.createdAt && (
                <div>
                  <span className="text-gray-500">Created</span>
                  <p className="text-gray-900">
                    {new Date(application.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
              {application.submittedAt && (
                <div>
                  <span className="text-gray-500">Submitted</span>
                  <p className="text-gray-900">
                    {new Date(application.submittedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {application.reviewedAt && (
                <div>
                  <span className="text-gray-500">Reviewed</span>
                  <p className="text-gray-900">
                    {new Date(application.reviewedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {application.approvedAt && (
                <div>
                  <span className="text-gray-500">Approved</span>
                  <p className="text-gray-900">
                    {new Date(application.approvedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {application.reviewer && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reviewer</h2>
              <p className="text-gray-900">
                {application.reviewer.firstName} {application.reviewer.lastName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewApplication;

