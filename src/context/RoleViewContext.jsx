import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const RoleViewContext = createContext();

export const useRoleView = () => {
  const context = useContext(RoleViewContext);
  if (!context) {
    throw new Error('useRoleView must be used within a RoleViewProvider');
  }
  return context;
};

export const RoleViewProvider = ({ children }) => {
  const { isAdmin } = useAuth();
  const [roleView, setRoleView] = useState(null); // null or 'finance-officer'

  // Initialize role view from localStorage or default to null (admin view)
  useEffect(() => {
    const storedRoleView = localStorage.getItem('adminRoleView');
    if (storedRoleView && storedRoleView === 'finance-officer') {
      setRoleView(storedRoleView);
    } else {
      setRoleView(null); // Default to admin view
    }
  }, []);

  // Reset to admin view when user is not admin
  useEffect(() => {
    if (!isAdmin()) {
      setRoleView(null);
      localStorage.removeItem('adminRoleView');
    }
  }, [isAdmin]);

  const switchRoleView = (view) => {
    if (!isAdmin()) {
      return; // Only admins can switch roles
    }
    
    if (view === 'finance-officer' || view === null) {
      setRoleView(view);
      if (view) {
        localStorage.setItem('adminRoleView', view);
      } else {
        localStorage.removeItem('adminRoleView');
      }
    }
  };

  const resetToAdminView = () => {
    setRoleView(null);
    localStorage.removeItem('adminRoleView');
  };

  const isFinanceOfficerView = () => roleView === 'finance-officer';
  const isAdminView = () => !roleView || roleView === null;

  const value = {
    roleView,
    switchRoleView,
    resetToAdminView,
    isFinanceOfficerView,
    isAdminView,
  };

  return <RoleViewContext.Provider value={value}>{children}</RoleViewContext.Provider>;
};

