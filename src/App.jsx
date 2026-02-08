import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleViewProvider } from './context/RoleViewContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import AddUser from './pages/AddUser';
import ViewUser from './pages/ViewUser';
import Scholarships from './pages/Scholarships';
import AddScholarship from './pages/AddScholarship';
import ViewScholarship from './pages/ViewScholarship';
import Applications from './pages/Applications';
import AddApplication from './pages/AddApplication';
import ViewApplication from './pages/ViewApplication';
import Payments from './pages/Payments';
import AddPayment from './pages/AddPayment';
import ViewPayment from './pages/ViewPayment';
import Locations from './pages/Locations';
import AddLocation from './pages/AddLocation';
import ViewLocation from './pages/ViewLocation';
import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';
import EditUser from './pages/EditUser';

function App() {
  return (
    <Router>
      <AuthProvider>
        <RoleViewProvider>
          <NotificationProvider>
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'SCHOLARSHIP_OFFICER']}>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/scholarships"
            element={
              <ProtectedRoute>
                <Layout>
                  <Scholarships />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/scholarships/new"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'SCHOLARSHIP_OFFICER']}>
                <Layout>
                  <AddScholarship />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/scholarships/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ViewScholarship />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <Layout>
                  <Applications />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/applications/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <AddApplication />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/applications/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ViewApplication />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/payments"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'APPLICANT']}>
                <Layout>
                  <Payments />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/payments/new"
            element={
              <ProtectedRoute requiredRoles={['ADMIN']}>
                <Layout>
                  <AddPayment />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/payments/:id"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'APPLICANT']}>
                <Layout>
                  <ViewPayment />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/users/new"
            element={
              <ProtectedRoute requiredRoles={['ADMIN']}>
                <Layout>
                  <AddUser />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'SCHOLARSHIP_OFFICER']}>
                <Layout>
                  <UserProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'SCHOLARSHIP_OFFICER']}>
                <Layout>
                  <ViewUser />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/users/:id/edit"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'SCHOLARSHIP_OFFICER']}>
                <Layout>
                  <EditUser />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/locations"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'SCHOLARSHIP_OFFICER']}>
                <Layout>
                  <Locations />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/locations/new"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'SCHOLARSHIP_OFFICER']}>
                <Layout>
                  <AddLocation />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/locations/:id"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'SCHOLARSHIP_OFFICER']}>
                <Layout>
                  <ViewLocation />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <EditProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Root route - always show login first */}
          <Route path="/" element={<Login />} />
        </Routes>
          </NotificationProvider>
        </RoleViewProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
