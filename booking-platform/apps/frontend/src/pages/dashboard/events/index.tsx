import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { eventAPI } from '@/lib/api';

export default function EventsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
  
  // Fetch user's events
  const { data, isLoading, error } = useQuery(
    'myEvents',
    eventAPI.getMyEvents
  );
  
  const events = data?.data?.data || [];
  
  // Filter events based on selected filter
  const filteredEvents = events.filter((event: any) => {
    const eventDate = new Date(event.schedule.startDate);
    const now = new Date();
    
    if (filter === 'upcoming') {
      return eventDate >= now;
    } else if (filter === 'past') {
      return eventDate < now;
    }
    
    return true; // 'all' filter
  });
  
  return (
    <ProtectedRoute roleRequired="provider">
      <DashboardLayout title="My Events">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Events</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your classes, workshops, and events
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => router.push('/dashboard/events/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Event
            </button>
          </div>
        </div>
        
        {/* Filter tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['all', 'upcoming', 'past'].map((filterOption) => (
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
        
        {/* Events list */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">Error loading events. Please try again.</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all'
                ? "You haven't created any events yet."
                : filter === 'upcoming'
                ? "You don't have any upcoming events."
                : "You don't have any past events."}
            </p>
            <button
              onClick={() => router.push('/dashboard/events/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create your first event
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {filteredEvents.map((event: any) => {
                const eventDate = new Date(event.schedule.startDate);
                const isPast = eventDate < new Date();
                
                return (
                  <li key={event._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{event.title}</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          {eventDate.toLocaleDateString()} at {event.schedule.timeSlot.start}
                        </p>
                        <div className="mt-2 flex items-center">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            isPast
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isPast ? 'Past' : 'Upcoming'}
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {event.attendees?.length || 0} bookings
                          </span>
                          {event.isPublic ? (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              Public
                            </span>
                          ) : (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              Private
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/dashboard/events/${event._id}`)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/events/${event._id}/edit`)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Edit
                        </button>
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