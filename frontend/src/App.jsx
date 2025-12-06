import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Login from './pages/Login';
import Register from './pages/Register';
import HomeRouter from './pages/HomeRouter';
import KostSearch from './pages/KostSearch';
import KostDetail from './pages/KostDetail';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import PaymentCallback from './pages/PaymentCallback';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerBookings from './pages/OwnerBookings';
import BookingConfirmation from './pages/BookingConfirmation';
import MyReservations from './pages/MyReservations';
import ReservationDetail from './pages/ReservationDetail';
import KostCreate from './pages/KostCreate';
import KostEdit from './pages/KostEdit';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminKostDetail from './pages/AdminKostDetail';
import AdminUsers from './pages/AdminUsers';
import AdminReservations from './pages/AdminReservations';
import VerifyEmail from './pages/VerifyEmail';

// Wrapper components to force remount on route change
function KostDetailWrapper() {
  const location = useLocation();
  return <KostDetail key={location.pathname} />;
}

function BookingWrapper() {
  const location = useLocation();
  return <Booking key={location.pathname} />;
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
          <Route path="/" element={<HomeRouter />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/kost" element={<KostSearch />} />
          <Route path="/kost/:id" element={<KostDetailWrapper />} />
          <Route path="/booking/:id" element={<BookingWrapper />} />
          <Route 
            path="/payment/:bookingId" 
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
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
            path="/dashboard/owner/bookings" 
            element={
              <ProtectedRoute>
                <OwnerBookings />
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
              <ProtectedRoute>
                <PaymentCallback />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings/:bookingId/payment/pending" 
            element={
              <ProtectedRoute>
                <PaymentCallback />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings/:bookingId/payment/error" 
            element={
              <ProtectedRoute>
                <PaymentCallback />
              </ProtectedRoute>
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
            path="/dashboard/admin/users" 
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin/reservations" 
            element={
              <ProtectedRoute>
                <AdminReservations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/kost/:id" 
            element={
              <ProtectedRoute>
                <AdminKostDetail />
              </ProtectedRoute>
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
              <ProtectedRoute>
                <KostEdit />
              </ProtectedRoute>
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
              <ProtectedRoute>
                <ReservationDetail />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
