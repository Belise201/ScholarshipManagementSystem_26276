import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user, but don't auto-set it immediately
    // This allows the login page to render first
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Only set user if it's valid
        if (parsedUser && parsedUser.id && parsedUser.email) {
          setUser(parsedUser);
        } else {
          // Clear invalid user data
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (e) {
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting login for:', email);
      // Use the proper login endpoint
      const response = await api.post('/auth/login', {
        email: email,
        password: password
      });

      console.log('AuthContext: Login response:', response.data);

      if (response.data.success && response.data.user) {
        const foundUser = response.data.user;
        console.log('AuthContext: User data received:', foundUser);

        // Extract role names from UserDTO
        let roleNames = [];
        if (foundUser.roleNames && Array.isArray(foundUser.roleNames)) {
          roleNames = foundUser.roleNames;
        } else if (foundUser.roles && Array.isArray(foundUser.roles)) {
          // Fallback: extract role names from role objects
          roleNames = foundUser.roles.map(role => {
            return typeof role === 'object' && role.name ? (role.name.name || role.name) : role;
          });
        }

        const userData = {
          id: foundUser.id,
          email: foundUser.email,
          username: foundUser.username,
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          roles: roleNames
        };

        console.log('AuthContext: Storing user data:', userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true, user: userData };
      } else {
        const errorMsg = response.data.message || 'Login failed';
        console.error('AuthContext: Login failed -', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      console.error('AuthContext: Returning error message:', errorMessage);
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasRole = (roleName) => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => {
      if (typeof role === 'string') {
        return role === roleName;
      }
      return role.name === roleName || role === roleName;
    });
  };

  const isAdmin = () => hasRole('ADMIN');
  const isApplicant = () => hasRole('APPLICANT');
  // Admin automatically has finance officer and reviewer capabilities
  const isFinanceOfficer = () => hasRole('ADMIN') || hasRole('FINANCE_OFFICER');
  const isReviewer = () => hasRole('ADMIN') || hasRole('REVIEWER');
  const isScholarshipOfficer = () => hasRole('SCHOLARSHIP_OFFICER');

  const value = {
    user,
    loading,
    login,
    logout,
    hasRole,
    isAdmin,
    isApplicant,
    isReviewer,
    isFinanceOfficer,
    isScholarshipOfficer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

