import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  FileText, 
  CreditCard, 
  MapPin,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRoleView } from '../context/RoleViewContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout, isAdmin, isApplicant, isReviewer, isFinanceOfficer, isScholarshipOfficer } = useAuth();
  const { isFinanceOfficerView, isAdminView, resetToAdminView } = useRoleView();

  // Define menu items based on role view
  const allMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['all'], views: ['all'] },
    { path: '/users', icon: Users, label: 'Users', roles: ['ADMIN', 'SCHOLARSHIP_OFFICER'], views: ['admin'] },
    { path: '/scholarships', icon: GraduationCap, label: 'Scholarships', roles: ['all'], views: ['all'] },
    { path: '/applications', icon: FileText, label: 'Applications', roles: ['all'], views: ['all'] },
    { path: '/payments', icon: CreditCard, label: 'Payments', roles: ['ADMIN', 'APPLICANT'], views: ['admin', 'finance-officer'] },
  ];

  // Filter menu items based on role view
  const menuItems = allMenuItems.filter(item => {
    // Check view access
    if (isAdmin() && isFinanceOfficerView() && !item.views.includes('finance-officer') && !item.views.includes('all')) {
      return false;
    }
    if (isAdmin() && isAdminView() && !item.views.includes('admin') && !item.views.includes('all')) {
      return false;
    }
    return true;
  });

  const canAccess = (roles) => {
    if (roles.includes('all')) return true;
    if (isAdmin()) return true;
    if (roles.includes('APPLICANT') && isApplicant()) return true;
    if (roles.includes('REVIEWER') && isReviewer()) return true;
    // Admin automatically has finance officer capabilities, so we check admin first
    if (roles.includes('FINANCE_OFFICER') && (isAdmin() || isFinanceOfficer())) return true;
    if (roles.includes('SCHOLARSHIP_OFFICER') && isScholarshipOfficer()) return true;
    return false;
  };

  const filteredMenuItems = menuItems.filter(item => canAccess(item.roles));

  return (
    <div className="w-64 bg-gradient-to-b from-primary-800 to-primary-900 text-white min-h-screen flex flex-col shadow-xl">
      <div className="p-6 border-b border-primary-700">
        <h1 className="text-2xl font-bold">ScholarshipHub</h1>
        <p className="text-primary-200 text-sm mt-1">Management System</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600 shadow-lg transform scale-105'
                  : 'hover:bg-primary-700 hover:translate-x-1'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary-700">
        <div className="px-4 py-2 mb-2">
          <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-primary-300">{user?.email}</p>
          {isAdmin() && isFinanceOfficerView() && (
            <div className="mt-2">
              <span className="text-xs px-2 py-1 rounded bg-primary-700 text-white">
                Finance Officer View
              </span>
            </div>
          )}
        </div>
        {isAdmin() && isFinanceOfficerView() && (
          <button
            onClick={resetToAdminView}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Admin View</span>
          </button>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

