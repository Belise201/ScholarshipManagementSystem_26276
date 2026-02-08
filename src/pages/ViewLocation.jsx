import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import { ArrowLeft } from 'lucide-react';

const ViewLocation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocation();
  }, [id]);

  const fetchLocation = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/locations/${id}`);
      setLocation(response.data);
    } catch (err) {
      console.error('Error fetching location:', err);
      setError('Failed to load location details');
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

  if (error || !location) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Location not found'}
        </div>
        <Button variant="secondary" onClick={() => navigate('/locations')}>
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          Back to Locations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/locations')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{location.name}</h1>
            <p className="text-gray-600 mt-1">Location Details</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Location Information */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Location Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="mt-1 text-gray-900 font-semibold">{location.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Code</label>
                  <p className="mt-1 text-gray-900 font-mono">{location.code}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="mt-1">
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {location.type || 'N/A'}
                  </span>
                </p>
              </div>
              {location.parent && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Parent Location</label>
                  <p className="mt-1 text-gray-900">
                    {location.parent.name} ({location.parent.code})
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Children Locations */}
          {location.children && location.children.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Child Locations</h2>
              <div className="space-y-2">
                {location.children.map(child => (
                  <div key={child.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{child.name}</p>
                    <p className="text-sm text-gray-500">Code: {child.code} | Type: {child.type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Hierarchy</h2>
            <div className="space-y-2 text-sm">
              {location.type === 'PROVINCE' && (
                <div className="p-2 bg-primary-50 rounded">
                  <span className="font-medium text-primary-700">Province</span>
                </div>
              )}
              {location.type === 'DISTRICT' && (
                <>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Province</span>
                    {location.parent && <p className="text-gray-900">{location.parent.name}</p>}
                  </div>
                  <div className="p-2 bg-primary-50 rounded">
                    <span className="font-medium text-primary-700">District</span>
                  </div>
                </>
              )}
              {location.type === 'SECTOR' && (
                <>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Province</span>
                    {location.parent?.parent && <p className="text-gray-900">{location.parent.parent.name}</p>}
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">District</span>
                    {location.parent && <p className="text-gray-900">{location.parent.name}</p>}
                  </div>
                  <div className="p-2 bg-primary-50 rounded">
                    <span className="font-medium text-primary-700">Sector</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewLocation;

