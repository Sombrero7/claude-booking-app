import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import MainLayout from '@/components/layout/MainLayout';
import { spaceAPI } from '@/lib/api';
import Link from 'next/link';

// Space card component
const SpaceCard = ({ space }: { space: any }) => {
  return (
    <Link href={`/spaces/${space._id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition h-full flex flex-col">
        <div className="h-48 bg-gray-200 relative">
          {space.photos && space.photos.length > 0 ? (
            <img 
              src={space.photos[0]} 
              alt={space.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600">
              <span className="text-lg font-medium">{space.title.substring(0, 2)}</span>
            </div>
          )}
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">{space.title}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {space.location.city}, {space.location.state}
          </p>
          <p className="mt-3 text-sm text-gray-600 line-clamp-2 flex-grow">
            {space.description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-primary-600 font-medium">${space.pricing.hourlyRate}/hr</span>
            <span className="text-sm text-gray-500">Up to {space.capacity} people</span>
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
        {/* Location */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={filters.city || ''}
            onChange={handleChange}
            placeholder="Enter city name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        {/* Capacity */}
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Capacity
          </label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            value={filters.capacity || ''}
            onChange={handleChange}
            min="1"
            placeholder="Min. number of people"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        {/* Price Range */}
        <div>
          <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Min Price (per hour)
          </label>
          <input
            type="number"
            id="minPrice"
            name="minPrice"
            value={filters.minPrice || ''}
            onChange={handleChange}
            min="0"
            placeholder="Min price"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Max Price (per hour)
          </label>
          <input
            type="number"
            id="maxPrice"
            name="maxPrice"
            value={filters.maxPrice || ''}
            onChange={handleChange}
            min="0"
            placeholder="Max price"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amenities
          </label>
          <div className="space-y-2">
            {['WiFi', 'Projector', 'Sound System', 'Air Conditioning', 'Kitchen', 'Parking'].map((amenity) => (
              <div key={amenity} className="flex items-center">
                <input
                  id={`amenity-${amenity}`}
                  name="amenities"
                  value={amenity}
                  type="checkbox"
                  checked={(filters.amenities || []).includes(amenity)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFilters({
                      ...filters,
                      amenities: checked
                        ? [...(filters.amenities || []), amenity]
                        : (filters.amenities || []).filter((a: string) => a !== amenity)
                    });
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor={`amenity-${amenity}`} className="ml-2 text-sm text-gray-700">
                  {amenity}
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

export default function SpacesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    capacity: '',
    minPrice: '',
    maxPrice: '',
    amenities: [] as string[]
  });
  
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 12,
    search: '',
    city: '',
    capacity: '',
    minPrice: '',
    maxPrice: '',
    amenities: [] as string[]
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

  // Fetch spaces with filters
  const { data, isLoading, error } = useQuery(
    ['spaces', queryParams],
    () => spaceAPI.getSpaces(queryParams),
    { keepPreviousData: true }
  );

  const spaces = data?.data?.data?.spaces || [];
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
      title="Rent Spaces - Booking Platform"
      description="Find and book the perfect space for your next class, workshop, or event"
    >
      <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Rent Spaces</h1>
            <p className="mt-2 text-gray-600">Find the perfect venue for your next class or event</p>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex overflow-hidden rounded-lg shadow-sm max-w-lg">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search spaces by name, description, or location..."
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
            
            {/* Spaces Grid */}
            <div className="flex-grow">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading spaces...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500">Error loading spaces. Please try again.</p>
                </div>
              ) : spaces.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No spaces found</h3>
                  <p className="text-gray-600">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {spaces.map((space: any) => (
                      <SpaceCard key={space._id} space={space} />
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

// apps/frontend/src/pages/spaces/[id].tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from 'react-query';
import { format, addHours, parseISO } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';
import { spaceAPI, requestAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const AmenityIcon = ({ amenity }: { amenity: string }) => {
  // Map amenities to icons (you can replace these with actual SVG icons)
  const getIcon = () => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return (
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      case 'projector':
        return (
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'sound system':
        return (
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 010-7.072m12.728 0l3.182-3.182m-3.182 3.182a9 9 0 010 12.728" />
          </svg>
        );
      case 'air conditioning':
        return (
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'kitchen':
        return (
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'parking':
        return (
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
    }
  };

  return (
    <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
      <div className="text-primary-600 mr-1">{getIcon()}</div>
      <span className="text-sm">{amenity}</span>
    </div>
  );
};

const SpaceDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser, userProfile } = useAuth();
  
  // State for booking form
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [attendeesCount, setAttendeesCount] = useState(1);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [selectedCreator, setSelectedCreator] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // Fetch space details
  const { data: spaceData, isLoading, error } = useQuery(
    ['space', id],
    () => spaceAPI.getSpaceById(id as string),
    {
      enabled: !!id
    }
  );

  // Get space data
  const space = spaceData?.data?.data;

  // Create request mutation
  const createRequest = useMutation(
    (requestData: any) => requestAPI.createRequest(requestData),
    {
      onSuccess: () => {
        // Redirect to requests dashboard page
        router.push('/dashboard/requests');
      },
      onError: (error: any) => {
        setBookingError(error.response?.data?.error?.message || 'Failed to create request');
      }
    }
  );

  const handleRequestSubmit = () => {
    if (!currentUser) {
      router.push(`/login?redirect=/spaces/${id}`);
      return;
    }

    if (!bookingDate || !startTime || !endTime) {
      setBookingError('Please select a date and time range');
      return;
    }

    if (selectedCreator && (!eventTitle || !eventDescription)) {
      setBookingError('Please provide event title and description');
      return;
    }

    // Format date and time strings into ISO date objects
    const start = new Date(`${bookingDate}T${startTime}`);
    const end = new Date(`${bookingDate}T${endTime}`);

    // Check if end time is after start time
    if (end <= start) {
      setBookingError('End time must be after start time');
      return;
    }

    // Create request data
    const requestData: any = {
      spaceId: id,
      title: eventTitle || `Space Rental: ${space.title}`,
      description: eventDescription || `Rental of ${space.title} for private use`,
      desiredDateTime: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      attendeesCount,
      specialRequirements
    };

    // If a creator is selected, add it to the request
    if (selectedCreator) {
      requestData.creatorId = selectedCreator;
    }

    // Submit request
    createRequest.mutate(requestData);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-500">Loading space details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !space) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-xl font-medium text-gray-900">Space not found</h2>
            <p className="mt-2 text-gray-500">The space you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={`${space.title} - Booking Platform`}
      description={space.description}
    >
      <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Space Header / Gallery */}
            <div className="h-96 bg-gray-200 relative grid grid-cols-1 md:grid-cols-3 gap-1">
              {space.photos && space.photos.length > 0 ? (
                <>
                  {/* Main photo */}
                  <div className="col-span-2 h-full">
                    <img 
                      src={space.photos[0]} 
                      alt={space.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Smaller photos */}
                  <div className="hidden md:grid grid-rows-2 gap-1 h-full">
                    {space.photos.slice(1, 3).map((photo: string, index: number) => (
                      <div key={index} className="h-full">
                        <img 
                          src={photo} 
                          alt={`${space.title} ${index + 2}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="col-span-3 w-full h-full flex items-center justify-center bg-primary-100 text-primary-600">
                  <span className="text-4xl font-medium">{space.title.substring(0, 2)}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
              {/* Space Information */}
              <div className="lg:col-span-2">
                <h1 className="text-2xl font-bold text-gray-900">{space.title}</h1>
                
                <div className="mt-2 flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>
                    {space.location.address}, {space.location.city}, {space.location.state} {space.location.zipCode}
                  </span>
                </div>

                <div className="mt-2 flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>
                    Capacity: up to {space.capacity} people
                  </span>
                </div>
                
                <div className="mt-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">About this space</h2>
                  <p className="text-gray-600 whitespace-pre-line">{space.description}</p>
                </div>
                
                {/* Amenities */}
                {space.amenities && space.amenities.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">Amenities</h2>
                    <div className="flex flex-wrap">
                      {space.amenities.map((amenity: string) => (
                        <AmenityIcon key={amenity} amenity={amenity} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Availability */}
                <div className="mt-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Available hours</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {space.availability && space.availability.map((slot: any) => (
                      <div key={slot.dayOfWeek} className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium">{slot.dayOfWeek}</div>
                        <div className="text-sm text-gray-600">{slot.startTime} - {slot.endTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Additional details can be added here */}
                
              </div>
              
              {/* Booking Sidebar */}
              <div className="lg:border-l lg:pl-8">
                <div className="bg-gray-50 rounded-lg p-6 mb-4">
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-xl font-medium text-gray-900">${space.pricing.hourlyRate}</h2>
                    <span className="text-sm text-gray-600">per hour</span>
                  </div>
                  
                  {space.pricing.minimumHours && (
                    <p className="mt-1 text-sm text-gray-600">
                      Minimum booking: {space.pricing.minimumHours} hours
                    </p>
                  )}
                  
                  {space.pricing.cleaningFee && (
                    <p className="mt-1 text-sm text-gray-600">
                      Cleaning fee: ${space.pricing.cleaningFee}
                    </p>
                  )}
                  
                  <div className="mt-4">
                    <button
                      onClick={() => setShowBookingForm(!showBookingForm)}
                      className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {showBookingForm ? 'Hide Booking Form' : 'Book This Space'}
                    </button>
                  </div>
                </div>
                
                {showBookingForm && (
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Request this space</h3>
                    
                    {/* Date and Time Selection */}
                    <div className="mb-4">
                      <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        id="bookingDate"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          id="startTime"
                          value={startTime}
                          onChange={(e) => {
                            setStartTime(e.target.value);
                            // Set end time to 1 hour after start time by default
                            if (e.target.value && !endTime) {
                              try {
                                const date = new Date(`2000-01-01T${e.target.value}`);
                                date.setHours(date.getHours() + 1);
                                setEndTime(date.toTimeString().slice(0, 5));
                              } catch (err) {
                                // Ignore parsing errors
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          id="endTime"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Attendees
                      </label>
                      <input
                        type="number"
                        id="attendees"
                        value={attendeesCount}
                        onChange={(e) => setAttendeesCount(Number(e.target.value))}
                        min="1"
                        max={space.capacity}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700 mb-1">
                        Special Requirements (optional)
                      </label>
                      <textarea
                        id="specialRequirements"
                        value={specialRequirements}
                        onChange={(e) => setSpecialRequirements(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Anything the venue owner should know?"
                      />
                    </div>
                    
                    {/* Option to include an instructor */}
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <input
                          id="includeInstructor"
                          type="checkbox"
                          checked={!!selectedCreator}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              setSelectedCreator('');
                              setEventTitle('');
                              setEventDescription('');
                            } else {
                              // You could pre-select an instructor here
                              // or show a list of available instructors
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="includeInstructor" className="ml-2 text-sm font-medium text-gray-700">
                          I need an instructor for this event
                        </label>
                      </div>
                      
                      {selectedCreator && (
                        <>
                          {/* Event details fields */}
                          <div className="p-4 border rounded-md bg-gray-50 space-y-4">
                            <div>
                              <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 mb-1">
                                Event Title
                              </label>
                              <input
                                type="text"
                                id="eventTitle"
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                placeholder="E.g., 'Yoga Workshop', 'Team Building Session'"
                              />
                            </div>
                            <div>
                              <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 mb-1">
                                Event Description
                              </label>
                              <textarea
                                id="eventDescription"
                                value={eventDescription}
                                onChange={(e) => setEventDescription(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Describe the event and what you're looking for from the instructor"
                              />
                            </div>
                            <div>
                              <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-1">
                                Select Instructor
                              </label>
                              <select
                                id="instructor"
                                value={selectedCreator}
                                onChange={(e) => setSelectedCreator(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="">Select an instructor</option>
                                {/* This would be populated with actual instructors from your API */}
                                <option value="instructor1">Jane Doe - Yoga Instructor</option>
                                <option value="instructor2">John Smith - Fitness Trainer</option>
                                <option value="instructor3">Emily Wong - Art Teacher</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Submit Button */}
                    <div className="mt-6">
                      <button
                        onClick={handleRequestSubmit}
                        disabled={createRequest.isLoading}
                        className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {createRequest.isLoading ? 'Submitting...' : 'Submit Request'}
                      </button>
                      
                      {bookingError && (
                        <p className="mt-2 text-sm text-red-600">{bookingError}</p>
                      )}
                    </div>
                    
                    <p className="mt-4 text-sm text-gray-600">
                      This is a request. The space owner will review and approve it before finalizing your booking.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SpaceDetails;