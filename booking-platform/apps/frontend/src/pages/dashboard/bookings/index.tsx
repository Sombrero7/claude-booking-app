import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { bookingAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function BookingsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past', 'cancelled'
  
  // Determine if user is a provider
  const isProvider = userProfile?.role === 'provider';
  
  // Fetch bookings (for customer) or event bookings (for provider)
  const { data, isLoading, error } = useQuery(
    'myBookings',
    () => bookingAPI.getMyBookings()
  );
  
  const bookings = data?.data?.data?.bookings || [];
  
  // Filter bookings based on selected filter
  const filteredBookings = bookings.filter((booking: any) => {
    const bookingDate = new Date(booking.eventDate);
    const now = new Date();
    
    if (filter === 'upcoming') {
      return bookingDate >= now && booking.status !== 'cancelled';
    } else if (filter === 'past') {
      return bookingDate < now && booking.status !== 'cancelled';
    } else if (filter === 'cancelled') {
      return booking.status === 'cancelled';
    }
    
    return true; // 'all' filter
  });
  
  return (
    <ProtectedRoute>
      <DashboardLayout title="My Bookings">
        <div className="mb-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Bookings</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isProvider 
              ? "Manage bookings for your events" 
              : "View your upcoming and past bookings"}
          </p>
        </div>
        
        {/* Filter tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['all', 'upcoming', 'past', 'cancelled'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`${
                  filter === filterOption
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {filterOption}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Bookings list */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">Error loading bookings. Please try again.</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all'
                ? "You don't have any bookings yet."
                : filter === 'upcoming'
                ? "You don't have any upcoming bookings."
                : filter === 'past'
                ? "You don't have any past bookings."
                : "You don't have any cancelled bookings."}
            </p>
            {!isProvider && (
              <button
                onClick={() => router.push('/events')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Browse events
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {filteredBookings.map((booking: any) => {
                const bookingDate = new Date(booking.eventDate);
                const isPast = bookingDate < new Date();
                
                return (
                  <li key={booking._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{booking.eventTitle || 'Event'}</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          {bookingDate.toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex items-center">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {booking.attendeesCount} {booking.attendeesCount === 1 ? 'person' : 'people'}
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            ${booking.totalAmount}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/dashboard/bookings/${booking._id}`)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          View
                        </button>
                        {booking.status !== 'cancelled' && !isPast && (
                          <button
                            onClick={() => {
                              // Implement cancel booking functionality
                              // This would typically be a mutation to update the booking status
                            }}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}