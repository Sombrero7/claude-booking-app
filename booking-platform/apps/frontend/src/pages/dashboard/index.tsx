import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { eventAPI, bookingAPI, spaceAPI, requestAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Stats card component
const StatsCard = ({ title, value, icon: Icon, change }: { title: string; value: string | number; icon: any; change?: { value: number; label: string } }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
                {change && (
                  <div className={`text-sm ${change.value >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                    {change.value >= 0 ? '+' : ''}{change.value}% {change.label}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { userProfile } = useAuth();
  const router = useRouter();

  // Determine dashboard type based on user role
  const isProvider = userProfile?.role === 'provider';
  
  // Fetch data based on role
  const { data: eventsData } = useQuery(
    'dashboardEvents', 
    eventAPI.getMyEvents,
    { enabled: isProvider }
  );
  
  const { data: bookingsData } = useQuery(
    'dashboardBookings', 
    () => bookingAPI.getMyBookings({ limit: 5 })
  );
  
  const { data: spacesData } = useQuery(
    'dashboardSpaces', 
    spaceAPI.getMySpaces,
    { enabled: isProvider }
  );
  
  const { data: requestsData } = useQuery(
    'dashboardRequests', 
    isProvider 
      ? requestAPI.getCreatorRequests 
      : requestAPI.getMyRequests
  );
  
  // Extract data
  const events = eventsData?.data?.data || [];
  const bookings = bookingsData?.data?.data?.bookings || [];
  const spaces = spacesData?.data?.data || [];
  const requests = requestsData?.data?.data?.requests || [];
  
  // Count stats
  const upcomingBookingsCount = bookings.filter((booking: any) => 
    new Date(booking.eventDate) > new Date() && booking.status !== 'cancelled'
  ).length;
  
  const pendingRequestsCount = requests.filter((request: any) => 
    request.status === 'pending'
  ).length;
  
  // Build stats based on user role
  const stats = isProvider 
    ? [
        { name: 'Events', value: events.length, icon: require('@heroicons/react/24/outline').CalendarIcon },
        { name: 'Spaces', value: spaces.length, icon: require('@heroicons/react/24/outline').MapPinIcon },
        { name: 'Bookings', value: upcomingBookingsCount, icon: require('@heroicons/react/24/outline').UserGroupIcon },
        { name: 'Requests', value: pendingRequestsCount, icon: require('@heroicons/react/24/outline').InboxIcon },
      ]
    : [
        { name: 'Upcoming Events', value: upcomingBookingsCount, icon: require('@heroicons/react/24/outline').CalendarIcon },
        { name: 'Pending Requests', value: pendingRequestsCount, icon: require('@heroicons/react/24/outline').InboxIcon },
      ];

  return (
    <ProtectedRoute>
      <DashboardLayout title="Dashboard">
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900">Welcome back, {userProfile?.profile?.name || 'User'}!</h2>
          <p className="mt-1 text-sm text-gray-600">Here's what's happening with your account.</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatsCard
              key={stat.name}
              title={stat.name}
              value={stat.value}
              icon={stat.icon}
            />
          ))}
        </div>
        
        {/* Provider Dashboard */}
        {isProvider ? (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Recent Events */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Events</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {events.length > 0 ? (
                  events.slice(0, 5).map((event: any) => (
                    <div key={event._id} className="p-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {new Date(event.schedule.startDate) > new Date() ? 'Upcoming' : 'Past'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {new Date(event.schedule.startDate).toLocaleDateString()} at {event.schedule.timeSlot.start}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600">{event.attendees?.length || 0} bookings</span>
                        <button
                          onClick={() => router.push(`/dashboard/events/${event._id}`)}
                          className="text-sm font-medium text-primary-600 hover:text-primary-500"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No events found. <button onClick={() => router.push('/dashboard/events/create')} className="text-primary-600 font-medium hover:text-primary-500">Create your first event</button>
                  </div>
                )}
              </div>
              {events.length > 0 && (
                <div className="bg-gray-50 px-6 py-3">
                  <button
                    onClick={() => router.push('/dashboard/events')}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    View all events
                  </button>
                </div>
              )}
            </div>
            
            {/* Recent Requests */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Requests</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {requests.length > 0 ? (
                  requests.slice(0, 5).map((request: any) => (
                    <div key={request._id} className="p-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{request.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : request.status === 'accepted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {new Date(request.desiredDateTime.start).toLocaleDateString()} at {new Date(request.desiredDateTime.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600">${request.priceBreakdown.creatorFee}</span>
                        <button
                          onClick={() => router.push(`/dashboard/requests/${request._id}`)}
                          className="text-sm font-medium text-primary-600 hover:text-primary-500"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No requests found.
                  </div>
                )}
              </div>
              {requests.length > 0 && (
                <div className="bg-gray-50 px-6 py-3">
                  <button
                    onClick={() => router.push('/dashboard/requests')}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    View all requests
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Customer Dashboard
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Upcoming Bookings */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Bookings</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {bookings.length > 0 ? (
                  bookings
                    .filter((booking: any) => new Date(booking.eventDate) > new Date() && booking.status !== 'cancelled')
                    .slice(0, 5)
                    .map((booking: any) => (
                      <div key={booking._id} className="p-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{booking.eventTitle || 'Event'}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : booking.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {new Date(booking.eventDate).toLocaleDateString()}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm text-gray-600">{booking.attendeesCount} {booking.attendeesCount === 1 ? 'person' : 'people'}</span>
                          <button
                            onClick={() => router.push(`/dashboard/bookings/${booking._id}`)}
                            className="text-sm font-medium text-primary-600 hover:text-primary-500"
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No upcoming bookings found. <button onClick={() => router.push('/events')} className="text-primary-600 font-medium hover:text-primary-500">Browse events</button>
                  </div>
                )}
              </div>
              {bookings.length > 0 && (
                <div className="bg-gray-50 px-6 py-3">
                  <button
                    onClick={() => router.push('/dashboard/bookings')}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    View all bookings
                  </button>
                </div>
              )}
            </div>
            
            {/* Pending Requests */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Your Requests</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {requests.length > 0 ? (
                  requests.slice(0, 5).map((request: any) => (
                    <div key={request._id} className="p-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{request.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : request.status === 'accepted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {new Date(request.desiredDateTime.start).toLocaleDateString()}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600">${request.priceBreakdown.totalCost}</span>
                        <button
                          onClick={() => router.push(`/dashboard/requests/${request._id}`)}
                          className="text-sm font-medium text-primary-600 hover:text-primary-500"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No requests found. <button onClick={() => router.push('/spaces')} className="text-primary-600 font-medium hover:text-primary-500">Browse spaces</button>
                  </div>
                )}
              </div>
              {requests.length > 0 && (
                <div className="bg-gray-50 px-6 py-3">
                  <button
                    onClick={() => router.push('/dashboard/requests')}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    View all requests
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isProvider ? (
              <>
                <button
                  onClick={() => router.push('/dashboard/events/create')}
                  className="bg-white shadow rounded-lg p-6 text-center hover:bg-gray-50"
                >
                  <div className="w-12 h-12 mx-auto bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">Create Event</h4>
                </button>
                <button
                  onClick={() => router.push('/dashboard/spaces/create')}
                  className="bg-white shadow rounded-lg p-6 text-center hover:bg-gray-50"
                >
                  <div className="w-12 h-12 mx-auto bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">List a Space</h4>
                </button>
                <button
                  onClick={() => router.push('/dashboard/bookings')}
                  className="bg-white shadow rounded-lg p-6 text-center hover:bg-gray-50"
                >
                  <div className="w-12 h-12 mx-auto bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">Manage Bookings</h4>
                </button>
                <button
                  onClick={() => router.push('/dashboard/payments')}
                  className="bg-white shadow rounded-lg p-6 text-center hover:bg-gray-50"
                >
                  <div className="w-12 h-12 mx-auto bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">View Payments</h4>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/events')}
                  className="bg-white shadow rounded-lg p-6 text-center hover:bg-gray-50"
                >
                  <div className="w-12 h-12 mx-auto bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">Explore Events</h4>
                </button>
                <button
                  onClick={() => router.push('/spaces')}
                  className="bg-white shadow rounded-lg p-6 text-center hover:bg-gray-50"
                >
                  <div className="w-12 h-12 mx-auto bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">Find Spaces</h4>
                </button>
                <button
                  onClick={() => router.push('/dashboard/bookings')}
                  className="bg-white shadow rounded-lg p-6 text-center hover:bg-gray-50"
                >
                  <div className="w-12 h-12 mx-auto bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">View Bookings</h4>
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="bg-white shadow rounded-lg p-6 text-center hover:bg-gray-50"
                >
                  <div className="w-12 h-12 mx-auto bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">Update Profile</h4>
                </button>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}