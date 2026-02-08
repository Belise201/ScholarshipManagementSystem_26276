import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Table from '../components/Table';
import Button from '../components/Button';
import { Plus, Eye } from 'lucide-react';

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLocations();
  }, [currentPage, searchTerm]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: 3,
        sortBy: 'id',
        sortDir: 'asc',
      };

      let response;
      if (searchTerm) {
        response = await api.get('/locations/search', {
          params: { ...params, searchTerm },
        });
      } else {
        response = await api.get('/locations', { params });
      }

      setLocations(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(0);
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
    },
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'code',
      label: 'Code',
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => value || 'N/A',
    },
    {
      key: 'parent',
      label: 'Parent',
      render: (value) => value?.name || 'N/A',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <button
          onClick={() => navigate(`/locations/${row.id}`)}
          className="p-1 text-primary-600 hover:text-primary-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600 mt-1">Manage location hierarchy</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/locations/new')}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Add Location
        </Button>
      </div>

      <Table
        columns={columns}
        data={locations}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={3}
        onPageChange={setCurrentPage}
        onSearch={handleSearch}
        searchPlaceholder="Search across all columns (name, code, type, parent)..."
      />
    </div>
  );
};

export default Locations;

