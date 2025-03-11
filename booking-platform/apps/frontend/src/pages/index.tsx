import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from 'react-query';
import MainLayout from '@/components/layout/MainLayout';
import { eventAPI, spaceAPI } from '@/lib/api';

// Featured events card component
const EventCard = ({ event }: { event: any }) => {
  return (
    <Link href={`/events/${event._id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
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
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">{event.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{new Date(event.schedule.startDate).toLocaleDateString()}</p>
          <div className="mt-2 flex items-center">
            <span className="text-primary-600 font-medium">${event.pricePerStudent}</span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-sm text-gray-500 truncate">{event.leadCreatorName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Featured spaces card component
const SpaceCard = ({ space }: { space: any }) => {
  return (
    <Link href={`/spaces/${space._id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
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
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">{space.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{space.location.city}, {space.location.state}</p>
          <div className="mt-2 flex items-center">
            <span className="text-primary-600 font-medium">${space.pricing.hourlyRate}/hr</span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-sm text-gray-500 truncate">Up to {space.capacity} people</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function Home() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');

  // Fetch featured events
  const { data: eventsData } = useQuery('featuredEvents', () => 
    eventAPI.getEvents({ limit: 4, sort: 'popularity' })
  );

  // Fetch featured spaces
  const { data: spacesData } = useQuery('featuredSpaces', () => 
    spaceAPI.getSpaces({ limit: 4, sort: 'popularity' })
  );

  const featuredEvents = eventsData?.data?.data?.events || [];
  const featuredSpaces = spacesData?.data?.data?.spaces || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/events?search=${encodeURIComponent(searchInput)}`);
    }
  };

  return (
    <MainLayout
      title="Booking Platform - Find and Book Classes, Workshops & Spaces"
      description="Connect with instructors, find studios, and book the perfect space for your next class or workshop"
    >
      {/* Hero Section */}
      <section className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold">
              Book classes & spaces all in one place
            </h1>
            <p className="mt-4 text-lg md:text-xl text-primary-100">
              Find instructors, book workshops, or rent the perfect space for your next event
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-8">
              <div className="flex overflow-hidden rounded-lg shadow-sm">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search events, classes, or spaces..."
                  className="flex-grow px-4 py-3 focus:outline-none text-gray-800"
                />
                <button
                  type="submit"
                  className="bg-secondary-800 hover:bg-secondary-900 px-6 py-3 text-white transition"
                >
                  Search
                </button>
              </div>
            </form>
            
            {/* Quick Links */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/events" className="bg-white text-primary-600 py-2 px-4 rounded-md font-medium hover:bg-primary-50 transition">
                Browse Classes
              </Link>
              <Link href="/spaces" className="bg-white text-primary-600 py-2 px-4 rounded-md font-medium hover:bg-primary-50 transition">
                Find Spaces
              </Link>
              <Link href="/dashboard/events/create" className="bg-primary-700 text-white py-2 px-4 rounded-md font-medium hover:bg-primary-800 transition">
                Host a Class
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Events Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Events</h2>
            <Link href="/events" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
              View all
              <svg className="ml-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredEvents.length > 0 ? (
              featuredEvents.map((event: any) => (
                <EventCard key={event._id} event={event} />
              ))
            ) : (
              <p className="col-span-full text-gray-500 text-center py-8">No events available at the moment.</p>
            )}
          </div>
        </div>
      </section>
      
      {/* Featured Spaces Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Spaces</h2>
            <Link href="/spaces" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
              View all
              <svg className="ml-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredSpaces.length > 0 ? (
              featuredSpaces.map((space: any) => (
                <SpaceCard key={space._id} space={space} />
              ))
            ) : (
              <p className="col-span-full text-gray-500 text-center py-8">No spaces available at the moment.</p>
            )}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Our platform connects instructors, venues, and students in one seamless experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Discover</h3>
              <p className="text-gray-600">
                Find classes, workshops, or spaces that match your interests and needs
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Book</h3>
              <p className="text-gray-600">
                Easily reserve your spot in classes or book venues for your events
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Attend</h3>
              <p className="text-gray-600">
                Join your classes with easy access to all booking details and information
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/how-it-works" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
              Learn more
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2">
              <h2 className="text-2xl md:text-3xl font-bold">Ready to get started?</h2>
              <p className="mt-3 text-primary-100">
                Join our platform today and connect with instructors, venues, and customers.
              </p>
            </div>
            <div className="mt-8 md:mt-0 flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="px-6 py-3 bg-white text-primary-700 text-center font-medium rounded-md hover:bg-primary-50">
                Sign up
              </Link>
              <Link href="/how-it-works" className="px-6 py-3 bg-primary-600 text-white text-center font-medium rounded-md hover:bg-primary-800">
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}