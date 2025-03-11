import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import MainLayout from '@/components/layout/MainLayout';
import { eventAPI } from '@/lib/api';
import Link from 'next/link';

// Event card component
const EventCard = ({ event }: { event: any }) => {
  return (
    <Link href={`/events/${event._id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition h-full flex flex-col">
        <div className="h-48 bg-gray-200 relative">
          {event.image ? (
            <img 
              src={event.image} 
              alt={event.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600">
              <span className="text-lg font-medium">{event.title.substring(0, 2)}</span>
            </div>
          )}
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">{event.title}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(event.schedule.startDate).toLocaleDateString()} at {event.schedule.timeSlot.start}
          </p>
          <p className="mt-3 text-sm text-gray-600 line-clamp-2 flex-grow">
            {event.description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-primary-600 font-medium">${event.pricePerStudent}</span>
            <span className="text-sm text-gray-500 truncate">{event.leadCreatorName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Filter sidebar component
const FilterSidebar = ({ 
  filters, 
  setFilters,
  applyFilters
}: { 
  filters: any; 
  setFilters: (filters: any) => void;
  applyFilters: () => void;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFilters({
      ...filters,
      [name]: newValue
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
      <h3 className="font-medium text-lg mb-4">Filters</h3>
      
      <div className="space-y-4">
        {/* Date Range */}
        <div>
          <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            id="fromDate"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            id="toDate"
            name="toDate"
            value={filters.toDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        {/* Price Range */}
        <div>
          <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Min Price
          </label>
          <input
            type="number"
            id="minPrice"
            name="minPrice"
            value={filters.minPrice}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Max Price
          </label>
          <input
            type="number"
            id="maxPrice"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categories
          </label>
          <div className="space-y-2">
            {['Fitness', 'Yoga', 'Art', 'Music', 'Cooking', 'Education'].map((tag) => (
              <div key={tag} className="flex items-center">
                <input
                  id={`tag-${tag}`}
                  name="tags"
                  value={tag}
                  type="checkbox"
                  checked={(filters.tags || []).includes(tag)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFilters({
                      ...filters,
                      tags: checked
                        ? [...(filters.tags || []), tag]
                        : (filters.tags || []).filter((t: string) => t !== tag)
                    });
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor={`tag-${tag}`} className="ml-2 text-sm text-gray-700">
                  {tag}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={applyFilters}
          className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default function EventsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    minPrice: '',
    maxPrice: '',
    tags: [] as string[]
  });
  
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 12,
    search: '',
    fromDate: '',
    toDate: '',
    minPrice: '',
    maxPrice: '',
    tags: [] as string[]
  });

  // Update search from query parameter
  useEffect(() => {
    if (router.query.search) {
      setSearch(router.query.search as string);
      setQueryParams(prev => ({
        ...prev,
        search: router.query.search as string
      }));
    }
  }, [router.query.search]);

  // Fetch events with filters
  const { data, isLoading, error } = useQuery(
    ['events', queryParams],
    () => eventAPI.getEvents(queryParams),
    { keepPreviousData: true }
  );

  const events = data?.data?.data?.events || [];
  const pagination = data?.data?.data?.pagination || { total: 0, pages: 1 };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryParams(prev => ({
      ...prev,
      search,
      page: 1
    }));
  };

  const applyFilters = () => {
    setQueryParams(prev => ({
      ...prev,
      ...filters,
      page: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    setQueryParams(prev => ({
      ...prev,
      page: newPage
    }));
    window.scrollTo(0, 0);
  };

  return (
    <MainLayout
      title="Events & Classes - Booking Platform"
      description="Browse and book classes, workshops, and events from top instructors"
    >
      <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Events & Classes</h1>
            <p className="mt-2 text-gray-600">Find and book your next class or workshop</p>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex overflow-hidden rounded-lg shadow-sm max-w-lg">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events by title, description, or instructor..."
                className="flex-grow px-4 py-3 focus:outline-none border-none"
              />
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 px-6 py-3 text-white transition"
              >
                Search
              </button>
            </div>
          </form>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filter Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
              <FilterSidebar 
                filters={filters} 
                setFilters={setFilters}
                applyFilters={applyFilters}
              />
            </div>
            
            {/* Events Grid */}
            <div className="flex-grow">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading events...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500">Error loading events. Please try again.</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event: any) => (
                      <EventCard key={event._id} event={event} />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePageChange(queryParams.page - 1)}
                          disabled={queryParams.page === 1}
                          className="px-3 py-1 rounded border border-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show current page, first page, last page, and pages around current
                            return (
                              page === 1 ||
                              page === pagination.pages ||
                              Math.abs(page - queryParams.page) <= 1
                            );
                          })
                          .map((page, index, array) => {
                            // If there's a gap, show ellipsis
                            const prevPage = array[index - 1];
                            const showEllipsis = prevPage && page - prevPage > 1;
                            
                            return (
                              <div key={page} className="flex items-center">
                                {showEllipsis && (
                                  <span className="px-3 py-1 text-gray-600">...</span>
                                )}
                                <button
                                  onClick={() => handlePageChange(page)}
                                  className={`px-3 py-1 rounded ${
                                    queryParams.page === page
                                      ? 'bg-primary-600 text-white'
                                      : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              </div>
                            );
                          })}
                        
                        <button
                          onClick={() => handlePageChange(queryParams.page + 1)}
                          disabled={queryParams.page === pagination.pages}
                          className="px-3 py-1 rounded border border-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// apps/frontend/src/pages/events/[id].tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from 'react-query';
import { format } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';
import { eventAPI, bookingAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const EventDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [attendeesCount, setAttendeesCount] = useState(1);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Fetch event details
  const { data: eventData, isLoading, error } = useQuery(
    ['event', id],
    () => eventAPI.getEventById(id as string),
    {
      enabled: !!id,
      onSuccess: (data) => {
        // Set default selected date to the first occurrence for single events
        if (data?.data?.data?.eventType === 'single') {
          setSelectedDate(data.data.data.schedule.startDate);
        }
      }
    }
  );

  // Fetch event occurrences for recurring events
  const { data: occurrencesData } = useQuery(
    ['eventOccurrences', id],
    () => eventAPI.getEventOccurrences(id as string),
    {
      enabled: !!id && eventData?.data?.data?.eventType === 'recurring'
    }
  );

  const event = eventData?.data?.data;
  const occurrences = occurrencesData?.data?.data || [];

  // Create booking mutation
  const createBooking = useMutation(
    (bookingData: any) => bookingAPI.createBooking(bookingData),
    {
      onSuccess: () => {
        setBookingSuccess(true);
        setBookingError('');
        // Redirect to booking confirmation or dashboard
        setTimeout(() => {
          router.push('/dashboard/bookings');
        }, 2000);
      },
      onError: (error: any) => {
        setBookingError(error.response?.data?.error?.message || 'Failed to create booking');
      }
    }
  );

  const handleBooking = () => {
    if (!currentUser) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }

    if (!selectedDate) {
      setBookingError('Please select a date');
      return;
    }

    createBooking.mutate({
      eventId: id,
      eventDate: selectedDate,
      attendeesCount,
      specialRequirements
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-500">Loading event details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !event) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-xl font-medium text-gray-900">Event not found</h2>
            <p className="mt-2 text-gray-500">The event you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={`${event.title} - Booking Platform`}
      description={event.description}
    >
      <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Event Header */}
            <div className="h-64 bg-gray-200 relative">
              {event.image ? (
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600">
                  <span className="text-4xl font-medium">{event.title.substring(0, 2)}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
              {/* Event Information */}
              <div className="lg:col-span-2">
                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                
                <div className="mt-4 flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Hosted by {event.leadCreatorName}</span>
                </div>
                
                <div className="mt-2 flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>
                    {event.location?.name || 'Location TBD'}
                  </span>
                </div>

                <div className="mt-2 flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {event.eventType === 'single' ? (
                      format(new Date(event.schedule.startDate), 'MMMM d, yyyy')
                    ) : (
                      'Multiple dates available'
                    )}
                    {' '}at {event.schedule.timeSlot.start}
                  </span>
                </div>
                
                <div className="mt-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">About this event</h2>
                  <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
                </div>
                
                {event.collaborators && event.collaborators.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Co-hosts</h2>
                    <div className="flex flex-wrap">
                      {event.collaborators.map((collaborator: any) => (
                        <div key={collaborator.creatorId} className="mr-4 mb-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-2">
                              {collaborator.creatorName?.charAt(0) || 'C'}
                            </div>
                            <span className="text-gray-900">{collaborator.creatorName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Additional details can be added here */}
                
              </div>
              
              {/* Booking Sidebar */}
              <div className="lg:border-l lg:pl-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-xl font-medium text-gray-900">${event.pricePerStudent}</h2>
                    <span className="text-sm text-gray-600">per person</span>
                  </div>
                  
                  {event.eventType === 'recurring' && occurrences.length > 0 && (
                    <div className="mt-4">
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        Select Date
                      </label>
                      <select
                        id="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select a date</option>
                        {occurrences.map((occurrence: any) => (
                          <option key={occurrence.date} value={occurrence.date}>
                            {format(new Date(occurrence.date), 'MMMM d, yyyy')}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Attendees
                    </label>
                    <select
                      id="attendees"
                      value={attendeesCount}
                      onChange={(e) => setAttendeesCount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      {Array.from({ length: Math.min(10, event.maxCapacity) }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'person' : 'people'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mt-4">
                    <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requirements (optional)
                    </label>
                    <textarea
                      id="requirements"
                      value={specialRequirements}
                      onChange={(e) => setSpecialRequirements(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Any special needs or requests?"
                    />
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={handleBooking}
                      disabled={createBooking.isLoading || bookingSuccess}
                      className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {createBooking.isLoading ? 'Processing...' : bookingSuccess ? 'Booked Successfully!' : 'Book Now'}
                    </button>
                    
                    {bookingError && (
                      <p className="mt-2 text-sm text-red-600">{bookingError}</p>
                    )}
                    
                    {bookingSuccess && (
                      <p className="mt-2 text-sm text-green-600">Booking successful! Redirecting to your bookings...</p>
                    )}
                  </div>
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      {event.maxCapacity - (event.attendees?.length || 0)} spots left
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EventDetails;