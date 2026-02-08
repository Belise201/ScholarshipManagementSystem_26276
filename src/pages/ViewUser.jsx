import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import { ArrowLeft, Edit, MapPin } from 'lucide-react';

const ViewUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [locationHierarchy, setLocationHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/users/${id}`);
      const userData = response.data;
      setUser(userData);

      // Fetch location hierarchy if user has a location
      if (userData.locationId) {
        try {
          const hierarchyResponse = await api.get(`/locations/${userData.locationId}/hierarchy`);
          setLocationHierarchy(hierarchyResponse.data || []);
        } catch (err) {
          console.error('Error fetching location hierarchy:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user details');
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
          {error || 'User not found'}
        </div>
        <Button variant="secondary" onClick={() => navigate('/users')}>
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          Back to Users
        </Button>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600 mt-1">User Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => navigate(`/users/${id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2 inline" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Username</label>
                  <p className="mt-1 text-gray-900 font-mono">{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-gray-900">{user.email}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.enabled ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="mt-1 text-gray-900">{user.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="mt-1 text-gray-900">{user.lastName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="mt-1 text-gray-900">{user.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="mt-1 text-gray-900">
                    {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Gender</label>
                <p className="mt-1 text-gray-900">{user.gender || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Roles */}
          {user.roles && user.roles.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Roles</h2>
              <div className="flex flex-wrap gap-2">
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

        {/* Sidebar */}
        <div className="space-y-6">
          {(locationHierarchy.length > 0 || user.location) && (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Location</h2>
              </div>
              {locationHierarchy.length > 0 ? (
                <div className="space-y-3">
                  {(() => {
                    const locationMap = {};
                    locationHierarchy.forEach(loc => {
                      locationMap[loc.type] = loc;
                    });
                    return (
                      <>
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
                      </>
                    );
                  })()}
                </div>
              ) : user.location ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name</span>
                    <p className="text-gray-900">{user.location.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Code</span>
                    <p className="text-gray-900 font-mono">{user.location.code}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Type</span>
                    <p className="text-gray-900">{user.location.type || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No location information available</p>
              )}
            </div>
          )}

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
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

export default ViewUser;

