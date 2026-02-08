import { useAuth } from '../context/AuthContext';
import { useRoleView } from '../context/RoleViewContext';
import AdminDashboard from './AdminDashboard';
import FinanceOfficerDashboard from './FinanceOfficerDashboard';
import ApplicantDashboard from './ApplicantDashboard';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const { isFinanceOfficerView } = useRoleView();
  
  // Route to appropriate dashboard based on role and view mode
  if (isAdmin()) {
    if (isFinanceOfficerView()) {
      return <FinanceOfficerDashboard />;
    }
    // Default to admin dashboard (admin can review applications through the applications page)
    return <AdminDashboard />;
  }
  
  return <ApplicantDashboard />;
};

export default Dashboard;

