import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import { ArrowLeft, Save } from 'lucide-react';

const AddLocation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'PROVINCE',
    parentId: '',
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations?page=0&size=1000');
      setLocations(response.data.content || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
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
      if (!formData.name || !formData.code) {
        setError('Name and code are required');
        setLoading(false);
        return;
      }

      const submissionData = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        parent: formData.parentId ? { id: parseInt(formData.parentId) } : null,
      };

      const response = await api.post('/locations', submissionData);
      
      if (response.status === 201 || response.data) {
        navigate('/locations');
      } else {
        setError('Failed to create location. Please try again.');
      }
    } catch (err) {
      console.error('Error creating location:', err);
      let errorMessage = 'Failed to create location. Please check all fields and try again.';
      
      if (err.response?.status === 400 || err.response?.status === 409) {
        if (err.response?.data) {
          errorMessage = typeof err.response.data === 'string' ? err.response.data : 'Location code may already exist';
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const locationTypes = [
    { value: 'PROVINCE', label: 'Province' },
    { value: 'DISTRICT', label: 'District' },
    { value: 'SECTOR', label: 'Sector' },
    { value: 'CELL', label: 'Cell' },
    { value: 'VILLAGE', label: 'Village' },
  ];

  // Filter parent locations based on type
  const getParentOptions = () => {
    if (formData.type === 'PROVINCE') {
      return [];
    }
    const parentTypeMap = {
      'DISTRICT': 'PROVINCE',
      'SECTOR': 'DISTRICT',
      'CELL': 'SECTOR',
      'VILLAGE': 'CELL',
    };
    const parentType = parentTypeMap[formData.type];
    return locations.filter(loc => loc.type === parentType);
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Add New Location</h1>
            <p className="text-gray-600 mt-1">Create a new location</p>
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
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Location Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter location name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter location code"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="input-field"
              >
                {locationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.type !== 'PROVINCE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Location
                </label>
                <select
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select parent location</option>
                  {getParentOptions().map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/locations')}
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
                Create Location
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddLocation;

