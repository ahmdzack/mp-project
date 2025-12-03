import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, User, LogOut, Menu, X, LayoutDashboard, Calendar } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span>KostKu</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-primary hover:font-semibold transition-all">
              Beranda
            </Link>
            
            <Link to="/kost" className="text-sm font-medium hover:text-primary hover:font-semibold transition-all">
              Cari Kost
            </Link>
            
            {user && user.role === 'pencari' && (
              <Link to="/reservations" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Reservasi Saya
              </Link>
            )}
            
            {user ? (
              <>
                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="max-w-[150px] truncate">{user.name}</span>
                    {user.role && (
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        user.role === 'pemilik' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 
                         user.role === 'pemilik' ? 'Owner' : 'Pencari'}
                      </span>
                    )}
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md border bg-background shadow-lg z-50">
                      <div className="p-2">
                        <div className="px-3 py-2 border-b">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          {user.role && (
                            <p className={`text-xs font-medium mt-1 ${
                              user.role === 'admin' ? 'text-red-600' :
                              user.role === 'pemilik' ? 'text-blue-600' :
                              'text-green-600'
                            }`}>
                              {user.role === 'admin' ? 'Super Admin' : 
                               user.role === 'pemilik' ? 'Pemilik Kost' : 'Pencari Kost'}
                            </p>
                          )}
                        </div>
                        
                        {user.role === 'admin' && (
                          <Link
                            to="/dashboard/admin"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard Admin
                          </Link>
                        )}
                        
                        {user.role === 'pemilik' && (
                          <Link
                            to="/dashboard/owner"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                          </Link>
                        )}
                        
                        {user.role === 'pencari' && (
                          <Link
                            to="/reservations"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                          >
                            <Calendar className="h-4 w-4" />
                            Reservasi Saya
                          </Link>
                        )}
                        
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 hover:text-destructive rounded-md mt-2 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-md transition-colors"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <Link 
                to="/" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Beranda
              </Link>
              
              {user ? (
                <>
                  {user.role === 'penyewa' && (
                    <Link 
                      to="/my-bookings" 
                      className="text-sm font-medium hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Booking Saya
                    </Link>
                  )}
                  <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground mb-2">{user.name}</div>
                    <div className="text-xs text-muted-foreground mb-3">{user.email}</div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/90 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
