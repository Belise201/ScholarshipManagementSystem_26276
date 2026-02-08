import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Table from '../components/Table';
import Button from '../components/Button';
import { Plus, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    fetchPayments();
  }, [currentPage, searchTerm]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: 3,
        sortBy: 'id',
        sortDir: 'asc',
      };

      let response;
      
      // For normal users (non-admin), only show their own payments
      if (!isAdmin() && user) {
        // Use the new user payments endpoint with pagination
        if (searchTerm) {
          response = await api.get(`/payments/user/${user.id}`, {
            params: { ...params, searchTerm },
          });
        } else {
          response = await api.get(`/payments/user/${user.id}`, { params });
        }
        setPayments(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      } else {
        // Admin sees all payments
        if (searchTerm) {
          response = await api.get('/payments/search', {
            params: { ...params, searchTerm },
          });
        } else {
          response = await api.get('/payments', { params });
        }
        setPayments(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
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
      key: 'application',
      label: 'Application',
      render: (value, row) => {
        if (row.application) {
          return `Application #${row.application.id}`;
        }
        return 'N/A';
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => value ? `${value.toLocaleString()} RWF` : 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'COMPLETED' ? 'bg-green-100 text-green-700' :
          value === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
          value === 'FAILED' ? 'bg-red-100 text-red-700' :
          value === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      render: (value) => value ? value.replace(/_/g, ' ') : 'N/A',
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => value ? value.replace(/_/g, ' ') : 'N/A',
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <button
          onClick={() => navigate(`/payments/${row.id}`)}
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
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin() ? 'Manage payment transactions' : 'View payment status'}
          </p>
        </div>
        {isAdmin() && (
          <Button variant="primary" onClick={() => navigate('/payments/new')}>
            <Plus className="w-4 h-4 mr-2 inline" />
            New Payment
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        data={payments}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={3}
        onPageChange={setCurrentPage}
        onSearch={handleSearch}
        searchPlaceholder="Search across all columns (application, amount, status, method, type, date)..."
      />
    </div>
  );
};

export default Payments;

