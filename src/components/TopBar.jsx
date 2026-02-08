import { Search, Bell, User, X, CheckCircle, Loader2, Users, GraduationCap, FileText, CreditCard, MapPin } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../utils/api';

const TopBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const notificationRef = useRef(null);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Debounced search function
  const handleGlobalSearch = useCallback(async (term) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!term || term.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSelectedIndex(-1);

      try {
        const [usersRes, scholarshipsRes, applicationsRes, paymentsRes, locationsRes] = await Promise.allSettled([
          api.get(`/users/search?searchTerm=${encodeURIComponent(term)}&page=0&size=5`),
          api.get(`/scholarships/search?searchTerm=${encodeURIComponent(term)}&page=0&size=5`),
          api.get(`/applications/search?searchTerm=${encodeURIComponent(term)}&page=0&size=5`),
          api.get(`/payments/search?searchTerm=${encodeURIComponent(term)}&page=0&size=5`),
          api.get(`/locations/search?searchTerm=${encodeURIComponent(term)}&page=0&size=5`),
        ]);

        const results = [];
        
        if (usersRes.status === 'fulfilled' && usersRes.value.data.content) {
          usersRes.value.data.content.forEach(user => {
            results.push({
              type: 'user',
              id: user.id,
              title: `${user.firstName} ${user.lastName}`,
              subtitle: user.email || user.username,
              path: `/users/${user.id}`,
              icon: Users
            });
          });
        }

        if (scholarshipsRes.status === 'fulfilled' && scholarshipsRes.value.data.content) {
          scholarshipsRes.value.data.content.forEach(scholarship => {
            results.push({
              type: 'scholarship',
              id: scholarship.id,
              title: scholarship.name,
              subtitle: scholarship.amount ? `Amount: ${scholarship.amount.toLocaleString()} RWF` : 'No amount specified',
              path: `/scholarships/${scholarship.id}`,
              icon: GraduationCap
            });
          });
        }

        if (applicationsRes.status === 'fulfilled' && applicationsRes.value.data.content) {
          applicationsRes.value.data.content.forEach(application => {
            results.push({
              type: 'application',
              id: application.id,
              title: `Application #${application.id}`,
              subtitle: application.scholarship?.name || application.applicant ? `${application.applicant.firstName} ${application.applicant.lastName}` : 'N/A',
              path: `/applications/${application.id}`,
              icon: FileText
            });
          });
        }

        if (paymentsRes.status === 'fulfilled' && paymentsRes.value.data.content) {
          paymentsRes.value.data.content.forEach(payment => {
            results.push({
              type: 'payment',
              id: payment.id,
              title: `Payment #${payment.id}`,
              subtitle: payment.amount ? `Amount: ${payment.amount.toLocaleString()} RWF` : 'No amount specified',
              path: `/payments/${payment.id}`,
              icon: CreditCard
            });
          });
        }

        if (locationsRes.status === 'fulfilled' && locationsRes.value.data.content) {
          locationsRes.value.data.content.forEach(location => {
            results.push({
              type: 'location',
              id: location.id,
              title: location.name,
              subtitle: `${location.code} - ${location.type}`,
              path: `/locations/${location.id}`,
              icon: MapPin
            });
          });
        }

        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleGlobalSearch(value);
  };

  const handleResultClick = (result) => {
    navigate(result.path);
    setSearchTerm('');
    setShowResults(false);
    setSelectedIndex(-1);
    if (onSearch) onSearch(result);
  };

  // Keyboard navigation for search results
  const handleKeyDown = (e) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleResultClick(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      setShowNotifications(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white shadow-md border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-2xl relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
            )}
            <input
              type="text"
              placeholder="Search users, scholarships, applications, payments, locations..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          
          {showResults && (
            <div 
              ref={resultsRef}
              className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto"
            >
              {isSearching ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  <p className="text-sm text-gray-500">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="p-2 border-b border-gray-200 bg-gray-50">
                    <p className="text-xs font-medium text-gray-600">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  {searchResults.map((result, index) => {
                    const Icon = result.icon || Search;
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={`${result.type}-${result.id}-${index}`}
                        onClick={() => handleResultClick(result)}
                        className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                          isSelected 
                            ? 'bg-primary-50 border-primary-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg ${
                              result.type === 'user' ? 'bg-blue-100 text-blue-600' :
                              result.type === 'scholarship' ? 'bg-green-100 text-green-600' :
                              result.type === 'application' ? 'bg-purple-100 text-purple-600' :
                              result.type === 'payment' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{result.title}</p>
                              <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ml-2 ${
                            result.type === 'user' ? 'bg-blue-100 text-blue-700' :
                            result.type === 'scholarship' ? 'bg-green-100 text-green-700' :
                            result.type === 'application' ? 'bg-purple-100 text-purple-700' :
                            result.type === 'payment' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {result.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="p-2 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500 text-center">
                      Use ↑↓ to navigate, Enter to select, Esc to close
                    </p>
                  </div>
                </>
              ) : searchTerm.trim().length >= 2 ? (
                <div className="p-8 text-center">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No results found</p>
                  <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4 ml-6">
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {!notification.read && (
                              <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="View Profile"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500">{user?.roles?.[0]?.name || 'User'}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;

