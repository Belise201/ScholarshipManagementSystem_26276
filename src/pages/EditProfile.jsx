import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Button from '../components/Button';
import HierarchicalLocationDropdown from '../components/HierarchicalLocationDropdown';
import { ArrowLeft, Save } from 'lucide-react';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    locationId: '',
  });

  useEffect(() => {
    if (!authUser || !authUser.id) {
      setError('User not found. Please log in again.');
      setFetching(false);
      return;
    }
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setFetching(true);
    try {
      const response = await api.get(`/users/${authUser.id}`);
      const user = response.data;
      setFormData({
        username: user.username || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || '',
        locationId: user.locationId || user.location?.id || '',
      });
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load profile details');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationChange = (e) => {
    setFormData(prev => ({
      ...prev,
      locationId: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Handle empty phone number - send null instead of empty string to avoid pattern validation issues
      const phoneNumber = formData.phoneNumber && formData.phoneNumber.trim() !== '' 
        ? formData.phoneNumber.trim() 
        : null;
      
      // Handle date format - ensure it's in YYYY-MM-DD format or null
      const dateOfBirth = formData.dateOfBirth && formData.dateOfBirth.trim() !== ''
        ? formData.dateOfBirth
        : null;
      
      // Handle gender - send null if empty
      const gender = formData.gender && formData.gender.trim() !== ''
        ? formData.gender
        : null;
      
      const submissionData = {
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: phoneNumber,
        dateOfBirth: dateOfBirth,
        gender: gender,
      };
      
      // Only include location if locationId is provided
      if (formData.locationId && formData.locationId.trim() !== '') {
        submissionData.location = { id: parseInt(formData.locationId) };
      }
      
      console.log('Submitting profile data:', submissionData);

      const response = await api.put(`/users/${authUser.id}/profile`, submissionData);
      
      if (response.status === 200 || response.data) {
        // Update the user in auth context if needed
        navigate('/profile');
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      console.error('Error response data:', JSON.stringify(err.response?.data, null, 2));
      console.error('Error response status:', err.response?.status);
      let errorMessage = 'Failed to update profile. Please check all fields and try again.';
      
      if (err.response?.status === 400) {
        // Handle validation errors
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.data?.errors) {
          // Spring validation errors format
          const errors = err.response.data.errors;
          errorMessage = Object.values(errors).flat().join(', ');
        } else if (typeof err.response?.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response?.data) {
          // Try to extract error message from response
          const data = err.response.data;
          if (data.error) {
            errorMessage = data.error;
          } else if (data.message) {
            errorMessage = data.message;
          } else {
            errorMessage = 'Validation error: Please check all required fields are filled correctly.';
          }
        }
      } else if (err.response?.status === 409) {
        errorMessage = err.response?.data?.message || err.response?.data || 'This email or username is already in use.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !formData.email) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-1">Update your account information</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Location</h2>
          <HierarchicalLocationDropdown
            value={formData.locationId}
            onChange={handleLocationChange}
            name="locationId"
            label="Location"
            required={false}
          />
        </div>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/profile')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2 inline" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;

