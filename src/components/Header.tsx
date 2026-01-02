import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Settings,
  BookOpen,
  Users,
  ChevronDown,
  Box,
  Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CSSTransition } from 'react-transition-group';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);

  const location = useLocation();
  const { user, logout } = useAuth();

  const dropdownNodeRef = useRef<HTMLDivElement | null>(null);

  const first = (user as any)?.firstName ?? (user as any)?.first ?? '';
  const last = (user as any)?.lastName ?? (user as any)?.last ?? '';
  const fullName = `${first} ${last}`.trim() || 'Account';

  const isAdmin = (user as any)?.isAdmin === true || (user as any)?.role === 'admin';

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsServicesDropdownOpen(false);
  };

  // Close services dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdownButton = document.getElementById('services-dropdown-button');
      const dropdownEl = dropdownNodeRef.current;

      if (!isServicesDropdownOpen) return;

      const target = event.target as Node;
      const clickedInsideDropdown = dropdownEl?.contains(target);
      const clickedButton = dropdownButton?.contains(target);

      if (!clickedInsideDropdown && !clickedButton) {
        setIsServicesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isServicesDropdownOpen]);

  // Close menus on route change
  useEffect(() => {
    setIsServicesDropdownOpen(false);
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
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
    { name: '1-1 Financial Coaching', href: '/coaching', icon: <UserIcon size={16} /> },
    { name: 'Courses', href: '/courses', icon: <BookOpen size={16} /> },
    { name: 'Group Sessions', href: '/groupsessions', icon: <Users size={16} /> },
    { name: 'Workshops', href: '/workshops', icon: <Box size={16} /> },
    { name: 'Availability', href: '/booking', icon: <Clock size={16} /> },
  ];

  const navigation = user ? loggedInNavigation : loggedOutNavigation;

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    closeAllMenus();
  };

  const isServicesRoute =
    location.pathname.startsWith('/coaching') ||
    location.pathname.startsWith('/courses') ||
    location.pathname.startsWith('/groupsessions') ||
    location.pathname.startsWith('/workshops');

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-40">
      <nav className="mx-auto px-6 sm:px-8 lg:px-14">
        {/* --- DESKTOP MENU --- */}
        <div className="hidden xl:flex items-center justify-between h-16">
          {/* Left: Logo and Nav */}
          <div className="flex items-center space-x-12">
            <Link to="/" className="flex items-center space-x-3" onClick={closeAllMenus}>
              <img src="/i.png" alt="Grima Financial" className="h-7 w-7" />
              <span className="text-xl font-bold text-grima-primary">Grima Financial</span>
            </Link>

            {/* Services Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="services-dropdown-button"
                onClick={() => setIsServicesDropdownOpen(v => !v)}
                className={`flex items-center text-base font-medium transition-colors duration-200 py-2 ${isServicesDropdownOpen || isServicesRoute
                    ? 'text-grima-primary'
                    : 'text-gray-700 hover:text-grima-primary'
                  }`}
              >
                All Services
                <ChevronDown
                  size={14}
                  className={`ml-1 transition-transform duration-200 ${isServicesDropdownOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

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
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </CSSTransition>
            </div>

            {/* Main nav links */}
            <div className="flex items-center space-x-8">
              {navigation.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={item.onClick || closeAllMenus}
                  className={`text-base font-medium transition-colors duration-200 ${location.pathname === item.href
                      ? 'text-grima-primary'
                      : 'text-gray-700 hover:text-grima-primary'
                    }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: auth */}
          <div>
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(v => !v)}
                  className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 flex items-center"
                >
                  <UserIcon size={20} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={closeAllMenus}
                      >
                        My Dashboard
                      </Link>

                      {isAdmin && (
                        <>
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={closeAllMenus}
                          >
                            <Settings size={14} className="inline mr-2" />
                            Admin Dashboard
                          </Link>

                          <Link
                            to="/admin/services"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={closeAllMenus}
                          >
                            <Box size={14} className="inline mr-2" />
                            Admin Services
                          </Link>
                        </>
                      )}


                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut size={14} className="inline mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-grima-primary rounded-md hover:bg-grima-dark transition-colors"
                >
                  Create an account
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* --- MOBILE MENU --- */}
        <div className="xl:hidden">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3" onClick={closeAllMenus}>
              <img src="/i.png" alt="Grima Financial" className="h-7 w-7" />
              <span className="text-lg font-bold text-grima-primary">Grima Financial</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsMenuOpen(v => !v)}
              className="text-gray-700 hover:text-grima-primary p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="pb-4 transition-all duration-300 ease-in-out">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                {/* Services dropdown */}
                <div className="border-b pb-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setIsServicesDropdownOpen(v => !v)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-base font-medium rounded-md ${isServicesDropdownOpen
                        ? 'text-grima-primary bg-grima-50'
                        : 'text-gray-700 hover:text-grima-primary hover:bg-grima-50'
                      }`}
                  >
                    All Services
                    <ChevronDown
                      size={18}
                      className={`ml-1 transition-transform ${isServicesDropdownOpen ? 'rotate-180' : ''
                        }`}
                    />
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
                          {item.icon}
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {navigation.map(item => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={item.onClick || closeAllMenus}
                    className={`block px-3 py-2 text-base font-medium rounded-md ${location.pathname === item.href
                        ? 'text-grima-primary bg-grima-50'
                        : 'text-gray-700 hover:text-grima-primary hover:bg-grima-50'
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}

                <div className="border-t pt-4 mt-4 space-y-2">
                  {user ? (
                    <>
                      <Link
                        to="/account"
                        className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                        onClick={closeAllMenus}
                      >
                        My Account
                      </Link>

                      {isAdmin && (
                        <>
                          <Link
                            to="/admin"
                            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                            onClick={closeAllMenus}
                          >
                            Admin Dashboard
                          </Link>

                          <Link
                            to="/admin/services"
                            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                            onClick={closeAllMenus}
                          >
                            Admin Services
                          </Link>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <Link
                        to="/login"
                        onClick={closeAllMenus}
                        className="w-full text-center border border-gray-400 px-4 py-2 rounded-lg font-medium"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={closeAllMenus}
                        className="w-full text-center bg-grima-primary text-white px-4 py-2 rounded-lg font-medium"
                      >
                        Create an account
                      </Link>
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
