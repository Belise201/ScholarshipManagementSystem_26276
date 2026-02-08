import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import HierarchicalLocationDropdown from '../components/HierarchicalLocationDropdown';
import { ArrowLeft, Save } from 'lucide-react';

const AddUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    locationId: '',
    roleNames: [],
  });


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const roleNames = prev.roleNames || [];
      if (checked) {
        // If ADMIN is selected, automatically exclude FINANCE_OFFICER and REVIEWER (they will be auto-added on backend)
        const newRoles = value === 'ADMIN' 
          ? [...roleNames.filter(r => r !== 'FINANCE_OFFICER' && r !== 'REVIEWER'), value]
          : [...roleNames, value];
        return { ...prev, roleNames: newRoles };
      } else {
        // If ADMIN is deselected, remove FINANCE_OFFICER and REVIEWER if they were there
        const newRoles = value === 'ADMIN'
          ? roleNames.filter(r => r !== value && r !== 'FINANCE_OFFICER' && r !== 'REVIEWER')
          : roleNames.filter(r => r !== value);
        return { ...prev, roleNames: newRoles };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      if (formData.roleNames.length === 0) {
        setError('Please select at least one role');
        setLoading(false);
        return;
      }

      // Filter out FINANCE_OFFICER and REVIEWER if present - backend will auto-add them for ADMIN
      const rolesToSubmit = formData.roleNames.filter(r => r !== 'FINANCE_OFFICER' && r !== 'REVIEWER');
      
      const submissionData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || null,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        location: formData.locationId ? { id: parseInt(formData.locationId) } : null,
        roles: rolesToSubmit.map(roleName => ({ name: roleName })),
        enabled: true,
      };

      const response = await api.post('/users', submissionData);
      
      if (response.status === 201 || response.data) {
        navigate('/users');
      } else {
        setError('Failed to create user. Please try again.');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      let errorMessage = 'Failed to create user. Please check all fields and try again.';
      
      if (err.response?.status === 400) {
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.data) {
          errorMessage = typeof err.response.data === 'string' ? err.response.data : 'Validation error';
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'ADMIN', label: 'Administrator (includes Finance Officer & Reviewer)' },
    { value: 'SCHOLARSHIP_OFFICER', label: 'Scholarship Officer' },
    { value: 'APPLICANT', label: 'Applicant' },
    { value: 'AUDITOR', label: 'Auditor' },
  ];

  const genders = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/users')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
            <p className="text-gray-600 mt-1">Create a new system user</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Account Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter username"
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
                className="input-field"
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="input-field"
              placeholder="Enter password (min 6 characters)"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="input-field"
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
                className="input-field"
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="input-field"
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
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select gender</option>
                {genders.map(gender => (
                  <option key={gender.value} value={gender.value}>
                    {gender.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <HierarchicalLocationDropdown
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                label="Location"
                className=""
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Roles</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {roles.map(role => (
              <label key={role.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={role.value}
                  checked={formData.roleNames.includes(role.value)}
                  onChange={handleRoleChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{role.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/users')}
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
                Create User
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;

