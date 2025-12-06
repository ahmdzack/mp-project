import { useAuth } from '../context/AuthContext';
import Home from './Home';
import OwnerHome from './OwnerHome';
import AdminHome from './AdminHome';

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

  // If user is admin, show admin home page
  if (user.role === 'admin') {
    return <AdminHome />;
  }

  // Default fallback
  return <Home />;
}

export default HomeRouter;
