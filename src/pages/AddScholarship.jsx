import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useNotifications } from '../context/NotificationContext';
import Button from '../components/Button';
import { ArrowLeft, Save } from 'lucide-react';

const AddScholarship = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    type: '',
    status: 'DRAFT',
    applicationDeadline: '',
    startDate: '',
    endDate: '',
    maxApplicants: '',
    eligibilityCriteria: '',
    requiredDocuments: '',
    minimumGpa: '',
    maximumFamilyIncome: '',
    targetEducationLevel: '',
  });

  // Function to reset form to initial state
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      type: '',
      status: 'DRAFT',
      applicationDeadline: '',
      startDate: '',
      endDate: '',
      maxApplicants: '',
      eligibilityCriteria: '',
      requiredDocuments: '',
      minimumGpa: '',
      maximumFamilyIncome: '',
      targetEducationLevel: '',
    });
  };

  const scholarshipTypes = [
    { value: 'ACADEMIC_EXCELLENCE', label: 'Academic Excellence' },
    { value: 'NEED_BASED', label: 'Need Based' },
    { value: 'SPORTS', label: 'Sports' },
    { value: 'ARTS', label: 'Arts' },
    { value: 'SCIENCE_TECHNOLOGY', label: 'Science & Technology' },
    { value: 'COMMUNITY_SERVICE', label: 'Community Service' },
    { value: 'MINORITY_SUPPORT', label: 'Minority Support' },
    { value: 'INTERNATIONAL', label: 'International' },
  ];

  const scholarshipStatuses = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'OPEN', label: 'Open' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'EVALUATION', label: 'Evaluation' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const educationLevels = [
    { value: '', label: 'Any' },
    { value: 'PRIMARY', label: 'Primary' },
    { value: 'SECONDARY', label: 'Secondary' },
    { value: 'TECHNICAL_VOCATIONAL', label: 'Technical/Vocational' },
    { value: 'UNDERGRADUATE', label: 'Undergraduate' },
    { value: 'POSTGRADUATE', label: 'Postgraduate' },
    { value: 'DOCTORAL', label: 'Doctoral' },
  ];

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
    setSuccess('');
    setLoading(true);

    try {
      // Prepare data for submission - ensure empty strings become null
      const cleanString = (value) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) return null;
        return typeof value === 'string' ? value.trim() : value;
      };

      const submissionData = {
        name: formData.name.trim(),
        description: cleanString(formData.description),
        amount: formData.amount && formData.amount !== '' ? parseFloat(formData.amount) : null,
        type: formData.type || null,
        status: formData.status || 'DRAFT',
        applicationDeadline: formData.applicationDeadline || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        maxApplicants: formData.maxApplicants && formData.maxApplicants !== '' 
          ? parseInt(formData.maxApplicants) 
          : null,
        eligibilityCriteria: cleanString(formData.eligibilityCriteria),
        requiredDocuments: cleanString(formData.requiredDocuments),
        minimumGpa: formData.minimumGpa && formData.minimumGpa !== '' 
          ? parseFloat(formData.minimumGpa) 
          : null,
        maximumFamilyIncome: formData.maximumFamilyIncome && formData.maximumFamilyIncome !== '' 
          ? parseFloat(formData.maximumFamilyIncome) 
          : null,
        targetEducationLevel: cleanString(formData.targetEducationLevel),
      };

      // Validate required fields
      if (!submissionData.name || !submissionData.amount || !submissionData.type) {
        setError('Please fill in all required fields (Name, Amount, Type)');
        setLoading(false);
        return;
      }

      // Validate required date fields
      if (!submissionData.applicationDeadline) {
        setError('Application deadline is required');
        setLoading(false);
        return;
      }

      if (!submissionData.startDate) {
        setError('Start date is required');
        setLoading(false);
        return;
      }

      if (!submissionData.endDate) {
        setError('End date is required');
        setLoading(false);
        return;
      }

      // Validate dates
      const deadline = new Date(submissionData.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare dates only
      
      if (deadline < today) {
        setError('Application deadline cannot be in the past');
        setLoading(false);
        return;
      }

      const start = new Date(submissionData.startDate);
      const end = new Date(submissionData.endDate);
      
      if (start > end) {
        setError('Start date cannot be after end date');
        setLoading(false);
        return;
      }

      // Log the data being sent for debugging
      console.log('Submitting scholarship data:', submissionData);

      const response = await api.post('/scholarships', submissionData);
      
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      // Check if the request was successful (201 Created or 200 OK with data)
      if (response.status === 201 || response.status === 200) {
        if (response.data && (response.data.id || response.data.name)) {
          console.log('Scholarship created successfully:', response.data);
          
          // Show success message
          setSuccess(`Scholarship "${response.data.name || 'Successfully'}" created successfully!`);
          
          // Notify all users about new scholarship (in production, backend would handle this)
          // For now, we'll add a notification that will be shown to users when they log in
          // In a real app, this would be sent via WebSocket or polling
          addNotification({
            type: 'info',
            title: 'New Scholarship Available',
            message: `A new scholarship "${response.data.name}" has been created. Check it out!`,
            link: `/scholarships/${response.data.id}`
          });
          
          // Clear the form
          resetForm();
          
          // Clear success message after 5 seconds
          setTimeout(() => {
            setSuccess('');
          }, 5000);
        } else {
          // Response received but no data - still consider it success if status is 201
          if (response.status === 201) {
            setSuccess('Scholarship successfully created!');
            resetForm();
            setTimeout(() => {
              setSuccess('');
            }, 5000);
          } else {
            setError('Scholarship may have been created, but no confirmation was received.');
          }
        }
      } else {
        setError('Failed to create scholarship. Please try again.');
      }
    } catch (err) {
      console.error('Error creating scholarship:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Request data that was sent:', submissionData);
      
      let errorMessage = 'Failed to create scholarship. Please check all fields and try again.';
      
      if (err.response?.status === 400) {
        // Bad Request - validation error
        if (err.response?.data?.message) {
          errorMessage = `Validation Error: ${err.response.data.message}`;
        } else if (typeof err.response?.data === 'string') {
          errorMessage = `Validation Error: ${err.response.data}`;
        } else if (err.response?.data?.error) {
          errorMessage = `Error: ${err.response.data.error}`;
        } else {
          // Try to extract error from response body
          const errorData = err.response?.data;
          if (errorData) {
            const errorKeys = Object.keys(errorData);
            if (errorKeys.length > 0) {
              errorMessage = `Validation Error: ${JSON.stringify(errorData)}`;
            } else {
              errorMessage = 'Validation error: Please check that all required fields are filled correctly. Make sure dates are valid and application deadline is not in the past.';
            }
          } else {
            errorMessage = 'Validation error: Please check that all required fields are filled correctly. Make sure dates are valid and application deadline is not in the past.';
          }
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
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
            onClick={() => navigate('/scholarships')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Scholarship</h1>
            <p className="text-gray-600 mt-1">Create a new scholarship program</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button
            onClick={() => {
              setSuccess('');
              navigate('/scholarships');
            }}
            className="text-green-700 hover:text-green-800 font-medium underline"
          >
            View Scholarships
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scholarship Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Enter scholarship name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder="Enter detailed description of the scholarship"
            />
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
                placeholder="Enter scholarship amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scholarship Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select type</option>
                {scholarshipTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field"
            >
              {scholarshipStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Important Dates</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                min={formData.startDate || ''}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Eligibility & Requirements */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Eligibility & Requirements</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eligibility Criteria
            </label>
            <textarea
              name="eligibilityCriteria"
              value={formData.eligibilityCriteria}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Enter eligibility criteria (e.g., age, nationality, etc.)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Documents
            </label>
            <textarea
              name="requiredDocuments"
              value={formData.requiredDocuments}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Enter required documents (e.g., transcript, recommendation letter, etc.)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum GPA
              </label>
              <input
                type="number"
                name="minimumGpa"
                value={formData.minimumGpa}
                onChange={handleChange}
                min="0"
                max="4.0"
                step="0.01"
                className="input-field"
                placeholder="e.g., 3.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Family Income (RWF)
              </label>
              <input
                type="number"
                name="maximumFamilyIncome"
                value={formData.maximumFamilyIncome}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
                placeholder="Enter maximum income"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Education Level
              </label>
              <select
                name="targetEducationLevel"
                value={formData.targetEducationLevel}
                onChange={handleChange}
                className="input-field"
              >
                {educationLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Capacity */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Capacity</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Applicants
            </label>
            <input
              type="number"
              name="maxApplicants"
              value={formData.maxApplicants}
              onChange={handleChange}
              min="1"
              className="input-field"
              placeholder="Leave empty for unlimited"
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave empty if there's no limit on the number of applicants
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/scholarships')}
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
                Create Scholarship
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddScholarship;

