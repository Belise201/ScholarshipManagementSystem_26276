import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Button from '../components/Button';
import { ArrowLeft, Save, Send } from 'lucide-react';

const AddApplication = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scholarships, setScholarships] = useState([]);
  const [formData, setFormData] = useState({
    scholarshipId: searchParams.get('scholarshipId') || '',
    personalStatement: '',
    academicAchievements: '',
    extracurricularActivities: '',
    workExperience: '',
    financialNeedStatement: '',
    requestedAmount: '',
  });

  useEffect(() => {
    fetchOpenScholarships();
  }, []);

  const fetchOpenScholarships = async () => {
    try {
      const response = await api.get('/scholarships/open');
      setScholarships(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching scholarships:', err);
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
      if (!formData.scholarshipId) {
        setError('Please select a scholarship');
        setLoading(false);
        return;
      }

      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('User not found. Please login again.');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);

      const submissionData = {
        scholarship: { id: parseInt(formData.scholarshipId) },
        applicant: { id: user.id },
        personalStatement: formData.personalStatement || null,
        academicAchievements: formData.academicAchievements || null,
        extracurricularActivities: formData.extracurricularActivities || null,
        workExperience: formData.workExperience || null,
        financialNeedStatement: formData.financialNeedStatement || null,
        requestedAmount: formData.requestedAmount ? parseFloat(formData.requestedAmount) : null,
        status: 'DRAFT',
      };

      const response = await api.post('/applications', submissionData, {
        params: { userId: user.id }
      });
      
      if (response.status === 201 || response.data) {
        setSuccess('Application created successfully! Submitting...');
        
        // Automatically submit the application
        try {
          await api.patch(`/applications/${response.data.id}/submit`);
          setSuccess('Application submitted successfully!');
          
          // Notify user
          addNotification({
            type: 'success',
            title: 'Application Submitted',
            message: `Your application for ${formData.scholarshipId ? scholarships.find(s => s.id === parseInt(formData.scholarshipId))?.name : 'scholarship'} has been submitted successfully.`,
            link: `/applications/${response.data.id}`
          });

          // Notify admin (this would be done via backend in production, but for now we'll simulate)
          // In a real app, the backend would send notifications to all admins
          
          setTimeout(() => {
            navigate('/applications');
          }, 2000);
        } catch (submitErr) {
          console.error('Error submitting application:', submitErr);
          setSuccess('Application created but not submitted. You can submit it later.');
          setTimeout(() => {
            navigate('/applications');
          }, 2000);
        }
      } else {
        setError('Failed to create application. Please try again.');
      }
    } catch (err) {
      console.error('Error creating application:', err);
      console.error('Error response:', err.response?.data);
      let errorMessage = 'Failed to create application. Please check all fields and try again.';
      
      // Handle different error response formats
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
          // If there's an existing application ID, add it to the message
          if (errorData.existingApplicationId) {
            errorMessage += ` (Application ID: ${errorData.existingApplicationId})`;
          }
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
            <h1 className="text-3xl font-bold text-gray-900">New Application</h1>
            <p className="text-gray-600 mt-1">Apply for a scholarship</p>
          </div>
        </div>
      </div>

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

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Scholarship Selection</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scholarship <span className="text-red-500">*</span>
            </label>
            <select
              name="scholarshipId"
              value={formData.scholarshipId}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="">Select a scholarship</option>
              {scholarships.map(scholarship => (
                <option key={scholarship.id} value={scholarship.id}>
                  {scholarship.name} - {scholarship.amount?.toLocaleString()} RWF
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Application Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal Statement
            </label>
            <textarea
              name="personalStatement"
              value={formData.personalStatement}
              onChange={handleChange}
              rows={5}
              className="input-field"
              placeholder="Tell us about yourself and why you deserve this scholarship..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Achievements
            </label>
            <textarea
              name="academicAchievements"
              value={formData.academicAchievements}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder="List your academic achievements, awards, honors..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extracurricular Activities
            </label>
            <textarea
              name="extracurricularActivities"
              value={formData.extracurricularActivities}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder="Describe your involvement in clubs, sports, volunteer work..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Experience
            </label>
            <textarea
              name="workExperience"
              value={formData.workExperience}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder="Describe any relevant work experience..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Financial Need Statement
            </label>
            <textarea
              name="financialNeedStatement"
              value={formData.financialNeedStatement}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder="Explain your financial situation and need for this scholarship..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requested Amount (RWF)
            </label>
            <input
              type="number"
              name="requestedAmount"
              value={formData.requestedAmount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="input-field"
              placeholder="Enter requested amount"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/applications')}
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
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2 inline" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddApplication;

