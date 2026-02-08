import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Button from '../components/Button';
import { ArrowLeft, MapPin, User, Mail, Phone, Calendar, Edit } from 'lucide-react';

const UserProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get userId from URL if viewing another user's profile
  const { user: authUser, isAdmin } = useAuth();
  const [user, setUser] = useState(null);
  const [locationHierarchy, setLocationHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, [id]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Determine which user's profile to fetch
      const userId = id || authUser?.id; // Use URL param if admin viewing another user, otherwise use current user
      
      // Check authorization: users can only view their own profile unless they're admin
      if (!userId) {
        setError('User not found. Please log in again.');
        return;
      }

      if (!isAdmin() && userId !== authUser?.id) {
        setError('You do not have permission to view this profile.');
        return;
      }

      // Fetch full user details from API
      const response = await api.get(`/users/${userId}`);
      const userData = response.data;
      console.log('User data received:', userData);
      setUser(userData);

      // Fetch location hierarchy if user has a location
      // Try locationId first (from getter method), then check location.id, then locationId property
      const locationId = userData.locationId || (userData.location && userData.location.id) || null;
      console.log('Extracted locationId:', locationId);
      console.log('userData.locationId:', userData.locationId);
      console.log('userData.location:', userData.location);
      
      if (locationId) {
        try {
          console.log('Fetching location hierarchy for locationId:', locationId);
          const hierarchyResponse = await api.get(`/locations/${locationId}/hierarchy`);
          console.log('Location hierarchy response:', hierarchyResponse.data);
          const hierarchy = hierarchyResponse.data || [];
          console.log('Setting location hierarchy with', hierarchy.length, 'locations');
          setLocationHierarchy(hierarchy);
        } catch (err) {
          console.error('Error fetching location hierarchy:', err);
          console.error('Error details:', err.response?.data);
          console.error('Error status:', err.response?.status);
          // If hierarchy fetch fails, we'll still show the location if available
        }
      } else {
        console.log('No locationId found in user data. Full userData:', JSON.stringify(userData, null, 2));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load profile');
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

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Failed to load profile'}
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Organize location hierarchy by type
  const locationMap = {};
  locationHierarchy.forEach(loc => {
    locationMap[loc.type] = loc;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(id && isAdmin() ? '/users' : '/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {id && isAdmin() ? `${user.firstName} ${user.lastName}'s Profile` : 'My Profile'}
            </h1>
            <p className="text-gray-600 mt-1">
              {id && isAdmin() ? 'View user account information' : 'View and manage your account information'}
            </p>
          </div>
        </div>
        {/* Only show edit button if viewing own profile or admin viewing other user */}
        {(!id || isAdmin()) && (
          <Button
            variant="primary"
            onClick={() => navigate(id && isAdmin() ? `/users/${id}/edit` : '/profile/edit')}
          >
            <Edit className="w-4 h-4 mr-2 inline" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="mt-1 text-gray-900 font-medium">{user.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="mt-1 text-gray-900 font-medium">{user.lastName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="mt-1 text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </label>
                  <p className="mt-1 text-gray-900">{user.phoneNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date of Birth
                  </label>
                  <p className="mt-1 text-gray-900">
                    {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="mt-1 text-gray-900">{user.gender || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Username</label>
                <p className="mt-1 text-gray-900 font-mono">{user.username}</p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Account Status</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account Status</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.enabled ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              {user.roles && user.roles.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Roles</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.roles.map((role, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                      >
                        {role.name ? role.name.replace(/_/g, ' ') : 'N/A'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Location Information */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Location</h2>
            </div>
            {locationHierarchy.length > 0 ? (
              <div className="space-y-3">
                {locationMap.PROVINCE && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Province</p>
                    <p className="text-sm font-medium text-gray-900">{locationMap.PROVINCE.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Code: {locationMap.PROVINCE.code}</p>
                  </div>
                )}
                {locationMap.DISTRICT && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">District</p>
                    <p className="text-sm font-medium text-gray-900">{locationMap.DISTRICT.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Code: {locationMap.DISTRICT.code}</p>
                  </div>
                )}
                {locationMap.SECTOR && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Sector</p>
                    <p className="text-sm font-medium text-gray-900">{locationMap.SECTOR.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Code: {locationMap.SECTOR.code}</p>
                  </div>
                )}
                {locationMap.CELL && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Cell</p>
                    <p className="text-sm font-medium text-gray-900">{locationMap.CELL.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Code: {locationMap.CELL.code}</p>
                  </div>
                )}
                {locationMap.VILLAGE && (
                  <div className="p-3 bg-primary-50 rounded-lg border-2 border-primary-200">
                    <p className="text-xs text-primary-600 mb-1 font-semibold">Village (Current Location)</p>
                    <p className="text-sm font-bold text-primary-900">{locationMap.VILLAGE.name}</p>
                    <p className="text-xs text-primary-500 mt-1">Code: {locationMap.VILLAGE.code}</p>
                  </div>
                )}
                {locationHierarchy.length === 0 && user.location && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{user.location.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Type: {user.location.type || 'N/A'}</p>
                  </div>
                )}
              </div>
            ) : user.location ? (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{user.location.name}</p>
                <p className="text-xs text-gray-400 mt-1">Code: {user.location.code || 'N/A'}</p>
                <p className="text-xs text-gray-400">Type: {user.location.type || 'N/A'}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No location information available</p>
            )}
          </div>

          {/* Metadata */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Member Since</span>
                <span className="text-gray-900">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-900">
                  {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

