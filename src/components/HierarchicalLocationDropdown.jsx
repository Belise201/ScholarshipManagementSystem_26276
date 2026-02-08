import { useState, useEffect } from 'react';
import api from '../utils/api';

const HierarchicalLocationDropdown = ({ 
  value, 
  onChange, 
  name = 'locationId',
  label = 'Location',
  required = false,
  className = ''
}) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedCell, setSelectedCell] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  const [loading, setLoading] = useState(false);
  const [hierarchyLoaded, setHierarchyLoaded] = useState(false);

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // If value is provided and we have provinces, try to determine the hierarchy
  useEffect(() => {
    if (value && provinces.length > 0 && !hierarchyLoaded) {
      fetchLocationHierarchy(value);
      setHierarchyLoaded(true);
    }
  }, [value, provinces, hierarchyLoaded]);

  const fetchProvinces = async () => {
    try {
      setLoading(true);
      
      // First check if backend is accessible and has data
      try {
        const healthResponse = await api.get('/locations/health');
        console.log('Location health check:', healthResponse.data);
        if (!healthResponse.data.hasProvinces) {
          console.warn('Backend reports no provinces available. Location data may not be initialized.');
        }
      } catch (healthErr) {
        console.warn('Health check failed (this is okay):', healthErr.message);
      }
      
      // Fetch provinces
      const response = await api.get('/locations/provinces');
      const provincesData = Array.isArray(response.data) ? response.data : [];
      console.log('Provinces fetched:', provincesData.length, 'provinces');
      
      if (provincesData.length > 0) {
        console.log('Sample provinces:', provincesData.slice(0, 3).map(p => p.name));
      }
      
      setProvinces(provincesData);
      
      if (provincesData.length === 0) {
        console.error('No provinces found in response. Response data:', response.data);
        console.warn('Possible issues:');
        console.warn('1. Backend may not be running');
        console.warn('2. Location data may not be initialized in database');
        console.warn('3. Check backend logs for initialization errors');
      }
    } catch (err) {
      console.error('Error fetching provinces:', err);
      console.error('Error details:', err.response?.data || err.message);
      console.error('Error status:', err.response?.status);
      console.error('Full error:', err);
      
      setProvinces([]);
      
      // Provide helpful error messages
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        console.error('Network error: Backend may not be running at http://localhost:8080');
      } else if (err.response?.status === 500) {
        console.error('Server error - check backend logs for details');
      } else if (err.response?.status === 404) {
        console.error('API endpoint not found - check backend route configuration');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationHierarchy = async (locationId) => {
    try {
      setLoading(true);
      const response = await api.get(`/locations/${locationId}/hierarchy`);
      const hierarchy = response.data || [];
      
      // Map hierarchy by type
      const hierarchyMap = {};
      hierarchy.forEach(loc => {
        hierarchyMap[loc.type] = loc;
      });

      // Load hierarchy from top to bottom
      if (hierarchyMap.PROVINCE) {
        setSelectedProvince(hierarchyMap.PROVINCE.id.toString());
        const districtsResponse = await api.get(`/locations/provinces/${hierarchyMap.PROVINCE.code}/districts`);
        setDistricts(districtsResponse.data || []);
        
        if (hierarchyMap.DISTRICT) {
          setSelectedDistrict(hierarchyMap.DISTRICT.id.toString());
          const sectorsResponse = await api.get(`/locations/districts/${hierarchyMap.DISTRICT.id}/sectors`);
          setSectors(sectorsResponse.data || []);
          
          if (hierarchyMap.SECTOR) {
            setSelectedSector(hierarchyMap.SECTOR.id.toString());
            const cellsResponse = await api.get(`/locations/sectors/${hierarchyMap.SECTOR.id}/cells`);
            setCells(cellsResponse.data || []);
            
            if (hierarchyMap.CELL) {
              setSelectedCell(hierarchyMap.CELL.id.toString());
              const villagesResponse = await api.get(`/locations/cells/${hierarchyMap.CELL.id}/villages`);
              setVillages(villagesResponse.data || []);
              
              if (hierarchyMap.VILLAGE) {
                setSelectedVillage(hierarchyMap.VILLAGE.id.toString());
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching location hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (provinceCode) => {
    try {
      setLoading(true);
      const response = await api.get(`/locations/provinces/${provinceCode}/districts`);
      const districtsData = Array.isArray(response.data) ? response.data : [];
      console.log(`Districts fetched for province ${provinceCode}:`, districtsData.length);
      setDistricts(districtsData);
      // Reset child selections
      setSelectedSector('');
      setSelectedCell('');
      setSelectedVillage('');
      setSectors([]);
      setCells([]);
      setVillages([]);
      if (onChange) {
        onChange({ target: { name, value: '' } });
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
      console.error('Error details:', err.response?.data || err.message);
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectors = async (districtId) => {
    try {
      setLoading(true);
      const response = await api.get(`/locations/districts/${districtId}/sectors`);
      const sectorsData = Array.isArray(response.data) ? response.data : [];
      setSectors(sectorsData);
      // Reset child selections
      setSelectedCell('');
      setSelectedVillage('');
      setCells([]);
      setVillages([]);
      if (onChange) {
        onChange({ target: { name, value: '' } });
      }
    } catch (err) {
      console.error('Error fetching sectors:', err);
      setSectors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCells = async (sectorId) => {
    try {
      setLoading(true);
      const response = await api.get(`/locations/sectors/${sectorId}/cells`);
      const cellsData = Array.isArray(response.data) ? response.data : [];
      setCells(cellsData);
      // Reset child selections
      setSelectedVillage('');
      setVillages([]);
      if (onChange) {
        onChange({ target: { name, value: '' } });
      }
    } catch (err) {
      console.error('Error fetching cells:', err);
      setCells([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVillages = async (cellId) => {
    try {
      setLoading(true);
      const response = await api.get(`/locations/cells/${cellId}/villages`);
      const villagesData = Array.isArray(response.data) ? response.data : [];
      setVillages(villagesData);
      if (onChange) {
        onChange({ target: { name, value: '' } });
      }
    } catch (err) {
      console.error('Error fetching villages:', err);
      setVillages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceChange = async (e) => {
    const provinceId = e.target.value;
    setSelectedProvince(provinceId);
    setHierarchyLoaded(false); // Reset hierarchy flag when user changes selection
    
    if (provinceId) {
      const province = provinces.find(p => p.id.toString() === provinceId);
      if (province) {
        await fetchDistricts(province.code);
      }
    } else {
      setDistricts([]);
      setSectors([]);
      setCells([]);
      setVillages([]);
      setSelectedDistrict('');
      setSelectedSector('');
      setSelectedCell('');
      setSelectedVillage('');
    }
    
    if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  const handleDistrictChange = async (e) => {
    const districtId = e.target.value;
    setSelectedDistrict(districtId);
    
    if (districtId) {
      await fetchSectors(parseInt(districtId));
    } else {
      setSectors([]);
      setCells([]);
      setVillages([]);
      setSelectedSector('');
      setSelectedCell('');
      setSelectedVillage('');
    }
    
    if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  const handleSectorChange = async (e) => {
    const sectorId = e.target.value;
    setSelectedSector(sectorId);
    
    if (sectorId) {
      await fetchCells(parseInt(sectorId));
    } else {
      setCells([]);
      setVillages([]);
      setSelectedCell('');
      setSelectedVillage('');
    }
    
    if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  const handleCellChange = async (e) => {
    const cellId = e.target.value;
    setSelectedCell(cellId);
    
    if (cellId) {
      await fetchVillages(parseInt(cellId));
    } else {
      setVillages([]);
      setSelectedVillage('');
    }
    
    if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  const handleVillageChange = (e) => {
    const villageId = e.target.value;
    setSelectedVillage(villageId);
    
    if (onChange) {
      onChange({ target: { name, value: villageId } });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Province Dropdown - Always show */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Province {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedProvince}
          onChange={handleProvinceChange}
          required={required}
          disabled={loading}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 appearance-none cursor-pointer"
        >
          <option value="">
            {loading ? 'Loading provinces...' : provinces.length === 0 ? 'No provinces available' : 'Select Province'}
          </option>
          {provinces.map(province => (
            <option key={province.id} value={province.id}>
              {province.name} {province.code ? `(${province.code})` : ''}
            </option>
          ))}
        </select>
        {provinces.length === 0 && !loading && (
          <p className="text-xs text-red-500 mt-1">
            No provinces found. Please ensure location data is loaded in the database.
          </p>
        )}
      </div>

      {/* District Dropdown */}
      {selectedProvince && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            District {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedDistrict}
            onChange={handleDistrictChange}
            required={required && selectedProvince}
            disabled={loading || districts.length === 0}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 appearance-none cursor-pointer"
          >
            <option value="">
              {loading ? 'Loading districts...' : districts.length === 0 ? 'No districts available' : 'Select District'}
            </option>
            {districts.map(district => (
              <option key={district.id} value={district.id}>
                {district.name} {district.code ? `(${district.code})` : ''}
              </option>
            ))}
          </select>
          {districts.length === 0 && !loading && selectedProvince && (
            <p className="text-xs text-gray-500 mt-1">No districts found for selected province.</p>
          )}
        </div>
      )}

      {/* Sector Dropdown */}
      {selectedDistrict && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sector {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedSector}
            onChange={handleSectorChange}
            required={required && selectedDistrict}
            disabled={loading || sectors.length === 0}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 appearance-none cursor-pointer"
          >
            <option value="">
              {loading ? 'Loading sectors...' : sectors.length === 0 ? 'No sectors available' : 'Select Sector'}
            </option>
            {sectors.map(sector => (
              <option key={sector.id} value={sector.id}>
                {sector.name} {sector.code ? `(${sector.code})` : ''}
              </option>
            ))}
          </select>
          {sectors.length === 0 && !loading && selectedDistrict && (
            <p className="text-xs text-gray-500 mt-1">No sectors found for selected district.</p>
          )}
        </div>
      )}

      {/* Cell Dropdown */}
      {selectedSector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cell {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={selectedCell}
            onChange={handleCellChange}
            required={required && selectedSector}
            disabled={loading || cells.length === 0}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 appearance-none cursor-pointer"
          >
            <option value="">
              {loading ? 'Loading cells...' : cells.length === 0 ? 'No cells available' : 'Select Cell'}
            </option>
            {cells.map(cell => (
              <option key={cell.id} value={cell.id}>
                {cell.name} {cell.code ? `(${cell.code})` : ''}
              </option>
            ))}
          </select>
          {cells.length === 0 && !loading && selectedSector && (
            <p className="text-xs text-gray-500 mt-1">No cells found for selected sector.</p>
          )}
        </div>
      )}

      {/* Village Dropdown */}
      {selectedCell && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Village {required && <span className="text-red-500">*</span>}
          </label>
          <select
            name={name}
            value={selectedVillage || value || ''}
            onChange={handleVillageChange}
            required={required && selectedCell}
            disabled={loading || villages.length === 0}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 appearance-none cursor-pointer"
          >
            <option value="">
              {loading ? 'Loading villages...' : villages.length === 0 ? 'No villages available' : 'Select Village'}
            </option>
            {villages.map(village => (
              <option key={village.id} value={village.id}>
                {village.name} {village.code ? `(${village.code})` : ''}
              </option>
            ))}
          </select>
          {villages.length === 0 && !loading && selectedCell && (
            <p className="text-xs text-gray-500 mt-1">No villages found for selected cell.</p>
          )}
        </div>
      )}

      {loading && (
        <div className="text-xs text-gray-500 italic">Loading...</div>
      )}
    </div>
  );
};

export default HierarchicalLocationDropdown;

