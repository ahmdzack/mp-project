import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import KostSearch from './pages/KostSearch';
import KostDetail from './pages/KostDetail';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import PaymentCallback from './pages/PaymentCallback';
import OwnerDashboard from './pages/OwnerDashboard';
import BookingConfirmation from './pages/BookingConfirmation';
import MyReservations from './pages/MyReservations';
import ReservationDetail from './pages/ReservationDetail';
import KostCreate from './pages/KostCreate';
import KostEdit from './pages/KostEdit';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminKostDetail from './pages/AdminKostDetail';
import VerifyEmail from './pages/VerifyEmail';

// Wrapper component to provide reactive key for routes with params
function RouteWrapper({ children }) {
  const location = useLocation();
  return <div key={location.pathname}>{children}</div>;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('🔐 ProtectedRoute check:', { 
    path: location.pathname, 
    hasUser: !!user, 
    userEmail: user?.email,
    loading 
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('✅ User authenticated, rendering children');
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/kost" element={<KostSearch />} />
          <Route path="/kost/:id" element={<RouteWrapper><KostDetail /></RouteWrapper>} />
          <Route path="/booking/:id" element={<RouteWrapper><Booking /></RouteWrapper>} />
          <Route 
            path="/payment/:bookingId" 
            element={
              <RouteWrapper>
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/dashboard/owner" 
            element={
              <ProtectedRoute>
                <OwnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings/confirmation" 
            element={
              <ProtectedRoute>
                <BookingConfirmation />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings/:bookingId/payment/success" 
            element={
              <RouteWrapper>
                <ProtectedRoute>
                  <PaymentCallback />
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/bookings/:bookingId/payment/pending" 
            element={
              <RouteWrapper>
                <ProtectedRoute>
                  <PaymentCallback />
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/bookings/:bookingId/payment/error" 
            element={
              <RouteWrapper>
                <ProtectedRoute>
                  <PaymentCallback />
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/dashboard/admin" 
            element={
              <ProtectedRoute>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/kost/:id" 
            element={
              <RouteWrapper>
                <ProtectedRoute>
                  <AdminKostDetail />
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/kost/create" 
            element={
              <ProtectedRoute>
                <KostCreate />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kost/edit/:id" 
            element={
              <RouteWrapper>
                <ProtectedRoute>
                  <KostEdit />
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
          <Route 
            path="/reservations" 
            element={
              <ProtectedRoute>
                <MyReservations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reservation/:id" 
            element={
              <RouteWrapper>
                <ProtectedRoute>
                  <ReservationDetail />
                </ProtectedRoute>
              </RouteWrapper>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
