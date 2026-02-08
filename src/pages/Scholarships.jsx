import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import Button from '../components/Button';
import { Plus, Eye, Send } from 'lucide-react';

const Scholarships = () => {
  const { isAdmin, isApplicant } = useAuth();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchScholarships();
  }, [currentPage, searchTerm]);

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: 3,
        sortBy: 'id',
        sortDir: 'asc',
      };

      let response;
      
      // For applicants, only show OPEN and PUBLISHED scholarships
      if (isApplicant() && !isAdmin()) {
        // Use paginated endpoint for open scholarships
        if (searchTerm) {
          // For search, we'll fetch paginated and filter client-side (since backend doesn't support search on open scholarships)
          const openResponse = await api.get('/scholarships/open/paginated', { 
            params: { page: 0, size: 100, sortBy: params.sortBy, sortDir: params.sortDir } 
          });
          const allOpen = openResponse.data.content || [];
          // Filter by search term
          const filtered = allOpen.filter(sch => 
            sch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sch.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sch.type?.toLowerCase().includes(searchTerm.toLowerCase())
          );
          // Paginate manually on filtered results
          const start = currentPage * params.size;
          const end = start + params.size;
          setScholarships(filtered.slice(start, end));
          setTotalPages(Math.ceil(Math.min(filtered.length, 100) / params.size));
          setTotalElements(filtered.length);
        } else {
          // Get open scholarships with proper pagination
          const openResponse = await api.get('/scholarships/open/paginated', { params });
          setScholarships(openResponse.data.content || []);
          setTotalPages(openResponse.data.totalPages || 0);
          setTotalElements(openResponse.data.totalElements || 0);
        }
      } else {
        // Admin sees all scholarships
        if (searchTerm) {
          response = await api.get('/scholarships/search', {
            params: { ...params, searchTerm },
          });
        } else {
          response = await api.get('/scholarships', { params });
        }
        setScholarships(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      }
    } catch (error) {
      console.error('Error fetching scholarships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(0);
  };

  const handleRowClick = (scholarship) => {
    // For applicants, clicking a row should open the application form
    if (isApplicant() && !isAdmin() && (scholarship.status === 'OPEN' || scholarship.status === 'PUBLISHED')) {
      navigate(`/applications/new?scholarshipId=${scholarship.id}`);
    } else {
      // For admins or non-open scholarships, navigate to view details
      navigate(`/scholarships/${scholarship.id}`);
    }
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
      key: 'amount',
      label: 'Amount',
      render: (value) => value ? `${value.toLocaleString()} RWF` : 'N/A',
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => value ? value.replace(/_/g, ' ') : 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'OPEN' ? 'bg-green-100 text-green-700' :
          value === 'PUBLISHED' ? 'bg-blue-100 text-blue-700' :
          value === 'CLOSED' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'applicationDeadline',
      label: 'Deadline',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A',
    },
    {
      key: 'maxApplicants',
      label: 'Max Applicants',
      render: (value) => value || 'Unlimited',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/scholarships/${row.id}`)}
            className="p-1 text-primary-600 hover:text-primary-700 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isApplicant() && !isAdmin() && (row.status === 'OPEN' || row.status === 'PUBLISHED') && (
            <button
              onClick={() => navigate(`/applications/new?scholarshipId=${row.id}`)}
              className="p-1 text-green-600 hover:text-green-700 transition-colors"
              title="Apply Now"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scholarships</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin() ? 'Manage scholarship programs' : 'Browse available scholarships and apply'}
          </p>
        </div>
        {isAdmin() && (
          <Button variant="primary" onClick={() => navigate('/scholarships/new')}>
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Scholarship
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        data={scholarships}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={3}
        onPageChange={setCurrentPage}
        onSearch={handleSearch}
        onRowClick={handleRowClick}
        searchPlaceholder="Search across all columns (name, amount, type, status, deadline)..."
      />
    </div>
  );
};

export default Scholarships;

