import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Table from '../components/Table';
import Button from '../components/Button';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
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
        response = await api.get('/users/search', {
          params: { ...params, searchTerm },
        });
      } else {
        response = await api.get('/users', { params });
      }

      setUsers(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(0);
  };

  const handleRowClick = (user) => {
    navigate(`/profile/${user.id}`);
  };

  const handleDelete = async (user, e) => {
    e.stopPropagation(); // Prevent row click from firing
    
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete user "${user.firstName} ${user.lastName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.delete(`/users/${user.id}`);
      
      if (response.status === 200) {
        addNotification({
          type: 'success',
          title: 'User Deleted',
          message: `User "${user.firstName} ${user.lastName}" has been deleted successfully.`,
        });
        
        // Refresh the user list
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      
      let errorMessage = 'Failed to delete user. ';
      if (error.response?.status === 409) {
        errorMessage += error.response?.data?.message || error.response?.data || 'User cannot be deleted (may have existing applications or is the last admin).';
      } else if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.data) {
        errorMessage += typeof error.response.data === 'string' ? error.response.data : 'Please try again.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: errorMessage,
      });
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
    },
    {
      key: 'firstName',
      label: 'Name',
      render: (value, row) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'username',
      label: 'Username',
    },
    {
      key: 'phoneNumber',
      label: 'Phone',
      render: (value) => value || 'N/A',
    },
    {
      key: 'roles',
      label: 'Roles',
      render: (value) => {
        if (!value || value.length === 0) return 'N/A';
        return value.map((role) => role.name || role).join(', ');
      },
    },
    {
      key: 'enabled',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${row.id}`);
            }}
            className="p-1 text-primary-600 hover:text-primary-700 transition-colors"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          {isAdmin() && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/users/${row.id}/edit`);
              }}
              className="p-1 text-green-600 hover:text-green-700 transition-colors"
              title="Edit User"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {isAdmin() && (
            <button
              onClick={(e) => handleDelete(row, e)}
              className="p-1 text-red-600 hover:text-red-700 transition-colors"
              title="Delete User"
            >
              <Trash2 className="w-4 h-4" />
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
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage system users</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/users/new')}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Add User
        </Button>
      </div>

      <Table
        columns={columns}
        data={users}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={3}
        onPageChange={setCurrentPage}
        onSearch={handleSearch}
        onRowClick={handleRowClick}
        searchPlaceholder="Search across all columns (name, email, username, phone, roles, status)..."
      />
    </div>
  );
};

export default Users;

