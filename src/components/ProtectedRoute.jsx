import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading, hasRole, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0) {
    const hasAccess = isAdmin() || requiredRoles.some(role => hasRole(role));
    if (!hasAccess) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You do not have permission to access this page. Required roles: {requiredRoles.join(', ')}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Your current roles: {user.roles?.join(', ') || 'None'}
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;

