import { useAuth } from '../context/AuthContext';
import Home from './Home';
import OwnerHome from './OwnerHome';
import { Navigate } from 'react-router-dom';

function HomeRouter() {
  const { user, loading } = useAuth();

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

  // If user is not logged in or is a pencari, show regular home page
  if (!user || user.role === 'pencari') {
    return <Home />;
  }

  // If user is pemilik, show owner home page
  if (user.role === 'pemilik') {
    return <OwnerHome />;
  }

  // If user is admin, redirect to admin dashboard
  if (user.role === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  // Default fallback
  return <Home />;
}

export default HomeRouter;
