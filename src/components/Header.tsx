import React, { useState, useRef } from 'react'; 
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, Calendar, BookOpen, Users, Brain, ChevronDown, Box } from 'lucide-react'; // Added Box icon
import { useAuth } from '../contexts/AuthContext';
import { CSSTransition } from 'react-transition-group'; 

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const dropdownNodeRef = useRef(null); // Ref for services dropdown CSSTransition

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsServicesDropdownOpen(false); 
  }

  // Handle outside clicks for services dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdownButton = document.getElementById('services-dropdown-button');
      // If the dropdown is open AND the click is outside the dropdown and its toggling button
      if (isServicesDropdownOpen && dropdownNodeRef.current && !(dropdownNodeRef.current as HTMLElement).contains(event.target as Node) &&
          dropdownButton && !dropdownButton.contains(event.target as Node)) {
        setIsServicesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isServicesDropdownOpen]); 

  // Close dropdown and mobile menu on route change
  React.useEffect(() => {
    setIsServicesDropdownOpen(false);
    setIsMenuOpen(false); 
  }, [location.pathname]);

  const handleAssessmentsClick = () => {
    if (location.pathname === '/assessments') {
        window.location.reload();
    }
    closeAllMenus();
  };

  const loggedOutNavigation = [
    { name: 'Book', href: '/booking' },
    { name: 'Assessments', href: '/assessments', onClick: handleAssessmentsClick },
  ];

  const loggedInNavigation = [
    { name: 'Dashboard', href: '/account' },
    { name: 'Book', href: '/booking' },
    { name: 'Assessments', href: '/assessments', onClick: handleAssessmentsClick },
  ];

  const servicesDropdownItems = [
    { name: '1-1 Financial Coaching', href: '/coaching', icon: <User size={16} /> },
    { name: 'Courses', href: '/courses', icon: <BookOpen size={16} /> },
    { name: 'Group Sessions', href: '/groupsessions', icon: <Users size={16} /> },
    { name: 'Workshops', href: '/workshops', icon: <Box size={16} /> }, // Added Workshops
  ];


  const navigation = user ? loggedInNavigation : loggedOutNavigation;
  const isAdmin = user?.isAdmin;

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-40">
      <nav className="mx-auto px-6 sm:px-8 lg:px-14">
        
        {/* --- DESKTOP MENU --- */}
        <div className="hidden xl:flex items-center justify-between h-16">
            {/* Left: Logo and Nav Items */}
            <div className="flex items-center space-x-12"> 
                 <Link to="/" className="flex items-center space-x-3" onClick={closeAllMenus}>
                    <img src="/i.png" alt="Grima Financial" className="h-7 w-7" />
                    <span className="text-xl font-bold text-grima-primary">Grima Financial</span>
                </Link>

                {/* All Services Dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        id="services-dropdown-button" 
                        onClick={() => setIsServicesDropdownOpen(!isServicesDropdownOpen)}
                        className={`flex items-center text-base font-medium transition-colors duration-200 py-2
                        ${ isServicesDropdownOpen || location.pathname.startsWith('/coaching') || location.pathname.startsWith('/courses') || location.pathname.startsWith('/groupsessions') || location.pathname.startsWith('/workshops') // Check for workshops path
                            ? 'text-grima-primary'
                            : 'text-gray-700 hover:text-grima-primary'
                        }`}
                    >
                        All Services <ChevronDown size={14} className={`ml-1 transition-transform duration-200 ${isServicesDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {/* CSSTransition for smooth dropdown animation */}
                    <CSSTransition
                      nodeRef={dropdownNodeRef}
                      in={isServicesDropdownOpen}
                      timeout={200} 
                      classNames="dropdown" 
                      unmountOnExit
                    >
                      <div 
                          ref={dropdownNodeRef} 
                          id="services-dropdown" 
                          className="absolute left-1/2 -translate-x-1/2 mt-3 w-60 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50"
                      >
                          {servicesDropdownItems.map(item => (
                              <Link
                                  key={item.name}
                                  to={item.href}
                                  onClick={closeAllMenus}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                  {item.icon}<span>{item.name}</span>
                              </Link>
                          ))}
                      </div>
                    </CSSTransition>
                </div>

                {/* Main Navigation (Book, Assessments) */}
                <div className="flex items-center space-x-8"> 
                    {navigation.map((item) => (
                        <Link
                        key={item.name}
                        to={item.href}
                         onClick={item.onClick || closeAllMenus}
                        className={`text-base font-medium transition-colors duration-200 flex items-center space-x-2 ${
                            location.pathname === item.href
                            ? 'text-grima-primary'
                            : 'text-gray-700 hover:text-grima-primary'
                        }`}
                        >
                        <span>{item.name}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Right: Auth Buttons / User Menu */}
            <div>
                {user ? (
                <div className="relative">
                    <button
                    type="button" 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 flex items-center"
                    >
                    <User size={20} />
                    </button>
                    {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                        <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                        <Link to="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeAllMenus}>My Dashboard</Link>
                        {isAdmin && <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeAllMenus}><Settings size={14} className="inline mr-2" />Admin</Link>}
                        <button type="button" onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><LogOut size={14} className="inline mr-2" />Sign Out</button>
                        </div>
                    </div>
                    )}
                </div>
                ) : (
                <div className="flex items-center space-x-4">
                    <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
                    Sign in
                    </Link>
                    <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-grima-primary rounded-md hover:bg-grima-dark transition-colors">
                    Create an account
                    </Link>
                </div>
                )}
            </div>
        </div>


        {/* --- MOBILE MENU --- */}
        <div className="xl:hidden">
            <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-3" onClick={closeAllMenus}>
                    <img src="/i.png" alt="Grima Financial" className="h-7 w-7" />
                    <span className="text-lg font-bold text-grima-primary">Grima Financial</span>
                </Link>
                {/* Hamburger Button */}
                <button type="button" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-grima-primary p-2">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Collapsible Mobile Navigation */}
            {isMenuOpen && (
            <div className="pb-4 transition-all duration-300 ease-in-out"> 
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                 {/* Services Dropdown in Mobile */}
                 <div className="border-b pb-2 mb-2">
                    <button
                        type="button"
                        onClick={() => setIsServicesDropdownOpen(!isServicesDropdownOpen)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-base font-medium rounded-md ${
                            isServicesDropdownOpen ? 'text-grima-primary bg-grima-50' : 'text-gray-700 hover:text-grima-primary hover:bg-grima-50'
                        }`}
                    >
                        All Services <ChevronDown size={18} className={`ml-1 transition-transform ${isServicesDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isServicesDropdownOpen && (
                        <div className="pt-2 pl-4 space-y-1 transition-all duration-300 ease-in-out"> 
                            {servicesDropdownItems.map(item => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={closeAllMenus}
                                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                >
                                    {item.icon}<span>{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                 </div>

                {navigation.map((item) => (
                    <Link key={item.name} to={item.href} onClick={item.onClick || closeAllMenus}
                    className={`block px-3 py-2 text-base font-medium rounded-md ${ location.pathname === item.href ? 'text-grima-primary bg-grima-50' : 'text-gray-700 hover:text-grima-primary hover:bg-grima-50' }`}>
                    {item.name}
                    </Link>
                ))}
                <div className="border-t pt-4 mt-4 space-y-2">
                {user ? (
                    <>
                        <Link to="/account" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50" onClick={closeAllMenus}>My Account</Link>
                        {isAdmin && <Link to="/admin" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50" onClick={closeAllMenus}>Admin Dashboard</Link>}
                        <button type="button" onClick={()=>{handleLogout(); closeAllMenus();}} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Sign Out</button>
                    </>
                    ) : (
                    <div className="flex flex-col space-y-2">
                        <Link to="/login" onClick={closeAllMenus} className="w-full text-center border border-gray-400 px-4 py-2 rounded-lg font-medium">Sign In</Link>
                        <Link to="/register" onClick={closeAllMenus} className="w-full text-center bg-grima-primary text-white px-4 py-2 rounded-lg font-medium">Create an account</Link>
                    </div>
                    )}
                </div>
                </div>
            </div>
            )}
        </div>
      </nav>
    </header>
  );
};

export default Header;