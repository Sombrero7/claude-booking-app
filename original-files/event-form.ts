// apps/frontend/src/pages/dashboard/events/create.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQuery } from 'react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { eventAPI, spaceAPI } from '@/lib/api';

// Form validation schema
const schema = yup.object().shape({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  eventType: yup.string().oneOf(['single', 'recurring']).required('Event type is required'),
  spaceId: yup.string().required('Space is required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().when('eventType', {
    is: 'recurring',
    then: yup.string().required('End date is required for recurring events'),
    otherwise: yup.string()
  }),
  daysOfWeek: yup.array().when('eventType', {
    is: 'recurring',
    then: yup.array().min(1, 'At least one day must be selected for recurring events'),
    otherwise: yup.array()
  }),
  startTime: yup.string().required('Start time is required'),
  endTime: yup.string().required('End time is required'),
  pricePerStudent: yup.number()
    .typeError('Price must be a number')
    .required('Price is required')
    .min(0, 'Price cannot be negative'),
  maxCapacity: yup.number()
    .typeError('Capacity must be a number')
    .required('Capacity is required')
    .min(1, 'Capacity must be at least 1'),
  isPublic: yup.boolean().required('Visibility is required'),
  tags: yup.array().of(yup.string())
});

export default function CreateEventPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');
  
  // Fetch user's spaces
  const { data: spacesData, isLoading: spacesLoading } = useQuery(
    'mySpaces',
    spaceAPI.getMySpaces
  );
  
  const spaces = spacesData?.data?.data || [];
  
  // Setup react-hook-form
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      eventType: 'single',
      spaceId: '',
      startDate: '',
      endDate: '',
      daysOfWeek: [],
      startTime: '',
      endTime: '',
      pricePerStudent: 0,
      maxCapacity: 1,
      isPublic: true,
      tags: []
    }
  });
  
  // Watch form values for conditional rendering
  const eventType = watch('eventType');
  
  // Create event mutation
  const createEvent = useMutation(
    (data: any) => eventAPI.createEvent(data),
    {
      onSuccess: (data) => {
        // Redirect to event details page
        const eventId = data.data.data._id;
        router.push(`/dashboard/events/${eventId}`);
      },
      onError: (error: any) => {
        setErrorMessage(error.response?.data?.error?.message || 'Failed to create event');
      }
    }
  );
  
  const onSubmit = async (formData: any) => {
    try {
      // Format the data for the API
      const apiData = {
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        spaceId: formData.spaceId,
        schedule: {
          startDate: formData.startDate,
          endDate: formData.eventType === 'recurring' ? formData.endDate : formData.startDate,
          daysOfWeek: formData.eventType === 'recurring' ? formData.daysOfWeek : undefined,
          timeSlot: {
            start: formData.startTime,
            end: formData.endTime
          }
        },
        pricePerStudent: formData.pricePerStudent,
        maxCapacity: formData.maxCapacity,
        isPublic: formData.isPublic,
        tags: formData.tags
      };
      
      await createEvent.mutateAsync(apiData);
    } catch (error) {
      // Error is handled by the mutation onError callback
    }
  };
  
  // Days of week options
  const daysOfWeek = [
    { value: 'Mon', label: 'Monday' },
    { value: 'Tue', label: 'Tuesday' },
    { value: 'Wed', label: 'Wednesday' },
    { value: 'Thu', label: 'Thursday' },
    { value: 'Fri', label: 'Friday' },
    { value: 'Sat', label: 'Saturday' },
    { value: 'Sun', label: 'Sunday' }
  ];
  
  // Tag options
  const tagOptions = [
    'Fitness', 'Yoga', 'Art', 'Music', 'Cooking', 'Education',
    'Wellness', 'Dance', 'Technology', 'Business', 'Language', 'Crafts'
  ];
  
  return (
    <ProtectedRoute roleRequired="provider">
      <DashboardLayout title="Create Event">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {errorMessage && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                {errorMessage}
              </div>
            )}
            
            {/* Basic Information */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Event Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    {...register('title')}
                    className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    placeholder="E.g., 'Yoga for Beginners'"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    {...register('description')}
                    className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Describe your event, what attendees can expect, etc."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Event Type
                  </label>
                  <div className="mt-2 space-x-4">
                    <div className="flex items-center">
                      <input
                        id="single"
                        type="radio"
                        value="single"
                        {...register('eventType')}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <label htmlFor="single" className="ml-2 block text-sm text-gray-700">
                        Single Session
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="recurring"
                        type="radio"
                        value="recurring"
                        {...register('eventType')}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <label htmlFor="recurring" className="ml-2 block text-sm text-gray-700">
                        Recurring (Series)
                      </label>
                    </div>
                  </div>
                  {errors.eventType && (
                    <p className="mt-1 text-sm text-red-600">{errors.eventType.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Location & Schedule */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Location & Schedule</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="spaceId" className="block text-sm font-medium text-gray-700">
                    Space
                  </label>
                  <select
                    id="spaceId"
                    {...register('spaceId')}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select a space</option>
                    {spacesLoading ? (
                      <option value="" disabled>Loading spaces...</option>
                    ) : spaces.length === 0 ? (
                      <option value="" disabled>No spaces available. Please create a space first.</option>
                    ) : (
                      spaces.map((space: any) => (
                        <option key={space._id} value={space._id}>
                          {space.title}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.spaceId && (
                    <p className="mt-1 text-sm text-red-600">{errors.spaceId.message}</p>
                  )}
                  {spaces.length === 0 && !spacesLoading && (
                    <p className="mt-1 text-sm text-blue-600">
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard/spaces/create')}
                        className="text-primary-600 hover:text-primary-500"
                      >
                        Create a space
                      </button>
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      {...register('startDate')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                    )}
                  </div>
                  
                  {eventType === 'recurring' && (
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        {...register('endDate')}
                        className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                      )}
                    </div>
                  )}
                </div>
                
                {eventType === 'recurring' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Days of Week
                    </label>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {daysOfWeek.map((day) => (
                        <div key={day.value} className="flex items-center">
                          <input
                            id={`day-${day.value}`}
                            type="checkbox"
                            value={day.value}
                            {...register('daysOfWeek')}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                          <label htmlFor={`day-${day.value}`} className="ml-2 block text-sm text-gray-700">
                            {day.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    {errors.daysOfWeek && (
                      <p className="mt-1 text-sm text-red-600">{errors.daysOfWeek.message}</p>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                      Start Time
                    </label>
                    <input
                      id="startTime"
                      type="time"
                      {...register('startTime')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.startTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                      End Time
                    </label>
                    <input
                      id="endTime"
                      type="time"
                      {...register('endTime')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.endTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pricing & Capacity */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Pricing & Capacity</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="pricePerStudent" className="block text-sm font-medium text-gray-700">
                      Price per Student ($)
                    </label>
                    <input
                      id="pricePerStudent"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('pricePerStudent')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.pricePerStudent && (
                      <p className="mt-1 text-sm text-red-600">{errors.pricePerStudent.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700">
                      Maximum Capacity
                    </label>
                    <input
                      id="maxCapacity"
                      type="number"
                      min="1"
                      {...register('maxCapacity')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.maxCapacity && (
                      <p className="mt-1 text-sm text-red-600">{errors.maxCapacity.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Settings */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Additional Settings</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Visibility
                  </label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="public"
                        type="radio"
                        value="true"
                        {...register('isPublic')}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <label htmlFor="public" className="ml-2 block text-sm text-gray-700">
                        Public (listed on the platform)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="private"
                        type="radio"
                        value="false"
                        {...register('isPublic')}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <label htmlFor="private" className="ml-2 block text-sm text-gray-700">
                        Private (only available via direct link)
                      </label>
                    </div>
                  </div>
                  {errors.isPublic && (
                    <p className="mt-1 text-sm text-red-600">{errors.isPublic.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tags (Categories)
                  </label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {tagOptions.map((tag) => (
                      <div key={tag} className="flex items-center">
                        <input
                          id={`tag-${tag}`}
                          type="checkbox"
                          value={tag}
                          {...register('tags')}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                        <label htmlFor={`tag-${tag}`} className="ml-2 block text-sm text-gray-700">
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.tags && (
                    <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard/events')}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createEvent.isLoading}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {createEvent.isLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// apps/frontend/src/pages/dashboard/events/[id]/edit.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQuery } from 'react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { eventAPI, spaceAPI } from '@/lib/api';

// Form validation schema - same as create page
const schema = yup.object().shape({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  eventType: yup.string().oneOf(['single', 'recurring']).required('Event type is required'),
  spaceId: yup.string().required('Space is required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().when('eventType', {
    is: 'recurring',
    then: yup.string().required('End date is required for recurring events'),
    otherwise: yup.string()
  }),
  daysOfWeek: yup.array().when('eventType', {
    is: 'recurring',
    then: yup.array().min(1, 'At least one day must be selected for recurring events'),
    otherwise: yup.array()
  }),
  startTime: yup.string().required('Start time is required'),
  endTime: yup.string().required('End time is required'),
  pricePerStudent: yup.number()
    .typeError('Price must be a number')
    .required('Price is required')
    .min(0, 'Price cannot be negative'),
  maxCapacity: yup.number()
    .typeError('Capacity must be a number')
    .required('Capacity is required')
    .min(1, 'Capacity must be at least 1'),
  isPublic: yup.boolean().required('Visibility is required'),
  tags: yup.array().of(yup.string())
});

export default function EditEventPage() {
  const router = useRouter();
  const { id } = router.query;
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch event details
  const { data: eventData, isLoading: eventLoading } = useQuery(
    ['event', id],
    () => eventAPI.getEventById(id as string),
    {
      enabled: !!id,
      onSuccess: (data) => {
        // Reset the form with event data
        const event = data.data.data;
        
        reset({
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          spaceId: event.spaceId,
          startDate: new Date(event.schedule.startDate).toISOString().split('T')[0],
          endDate: event.schedule.endDate 
            ? new Date(event.schedule.endDate).toISOString().split('T')[0] 
            : '',
          daysOfWeek: event.schedule.daysOfWeek || [],
          startTime: event.schedule.timeSlot.start,
          endTime: event.schedule.timeSlot.end,
          pricePerStudent: event.pricePerStudent,
          maxCapacity: event.maxCapacity,
          isPublic: event.isPublic,
          tags: event.tags || []
        });
      }
    }
  );
  
  // Fetch user's spaces
  const { data: spacesData, isLoading: spacesLoading } = useQuery(
    'mySpaces',
    spaceAPI.getMySpaces
  );
  
  const spaces = spacesData?.data?.data || [];
  
  // Setup react-hook-form
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      eventType: 'single',
      spaceId: '',
      startDate: '',
      endDate: '',
      daysOfWeek: [],
      startTime: '',
      endTime: '',
      pricePerStudent: 0,
      maxCapacity: 1,
      isPublic: true,
      tags: []
    }
  });
  
  // Watch form values for conditional rendering
  const eventType = watch('eventType');
  
  // Update event mutation
  const updateEvent = useMutation(
    (data: any) => eventAPI.updateEvent(id as string, data),
    {
      onSuccess: () => {
        setSuccessMessage('Event updated successfully');
        setErrorMessage('');
        setTimeout(() => {
          router.push(`/dashboard/events/${id}`);
        }, 1500);
      },
      onError: (error: any) => {
        setErrorMessage(error.response?.data?.error?.message || 'Failed to update event');
        setSuccessMessage('');
      }
    }
  );
  
  const onSubmit = async (formData: any) => {
    try {
      // Format the data for the API
      const apiData = {
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        spaceId: formData.spaceId,
        schedule: {
          startDate: formData.startDate,
          endDate: formData.eventType === 'recurring' ? formData.endDate : formData.startDate,
          daysOfWeek: formData.eventType === 'recurring' ? formData.daysOfWeek : undefined,
          timeSlot: {
            start: formData.startTime,
            end: formData.endTime
          }
        },
        pricePerStudent: formData.pricePerStudent,
        maxCapacity: formData.maxCapacity,
        isPublic: formData.isPublic,
        tags: formData.tags
      };
      
      await updateEvent.mutateAsync(apiData);
    } catch (error) {
      // Error is handled by the mutation onError callback
    }
  };
  
  // Days of week options
  const daysOfWeek = [
    { value: 'Mon', label: 'Monday' },
    { value: 'Tue', label: 'Tuesday' },
    { value: 'Wed', label: 'Wednesday' },
    { value: 'Thu', label: 'Thursday' },
    { value: 'Fri', label: 'Friday' },
    { value: 'Sat', label: 'Saturday' },
    { value: 'Sun', label: 'Sunday' }
  ];
  
  // Tag options
  const tagOptions = [
    'Fitness', 'Yoga', 'Art', 'Music', 'Cooking', 'Education',
    'Wellness', 'Dance', 'Technology', 'Business', 'Language', 'Crafts'
  ];
  
  if (eventLoading) {
    return (
      <ProtectedRoute roleRequired="provider">
        <DashboardLayout title="Edit Event">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading event details...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute roleRequired="provider">
      <DashboardLayout title="Edit Event">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {errorMessage && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                {errorMessage}
              </div>
            )}
            
            {successMessage && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
                {successMessage}
              </div>
            )}
            
            {/* Basic Information */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Event Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    {...register('title')}
                    className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    {...register('description')}
                    className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Event Type
                  </label>
                  <div className="mt-2 space-x-4">
                    <div className="flex items-center">
                      <input
                        id="single"
                        type="radio"
                        value="single"
                        {...register('eventType')}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <label htmlFor="single" className="ml-2 block text-sm text-gray-700">
                        Single Session
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="recurring"
                        type="radio"
                        value="recurring"
                        {...register('eventType')}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <label htmlFor="recurring" className="ml-2 block text-sm text-gray-700">
                        Recurring (Series)
                      </label>
                    </div>
                  </div>
                  {errors.eventType && (
                    <p className="mt-1 text-sm text-red-600">{errors.eventType.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Location & Schedule */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Location & Schedule</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="spaceId" className="block text-sm font-medium text-gray-700">
                    Space
                  </label>
                  <select
                    id="spaceId"
                    {...register('spaceId')}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select a space</option>
                    {spacesLoading ? (
                      <option value="" disabled>Loading spaces...</option>
                    ) : spaces.length === 0 ? (
                      <option value="" disabled>No spaces available. Please create a space first.</option>
                    ) : (
                      spaces.map((space: any) => (
                        <option key={space._id} value={space._id}>
                          {space.title}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.spaceId && (
                    <p className="mt-1 text-sm text-red-600">{errors.spaceId.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      {...register('startDate')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                    )}
                  </div>
                  
                  {eventType === 'recurring' && (
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        {...register('endDate')}
                        className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                      )}
                    </div>
                  )}
                </div>
                
                {eventType === 'recurring' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Days of Week
                    </label>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {daysOfWeek.map((day) => (
                        <div key={day.value} className="flex items-center">
                          <input
                            id={`day-${day.value}`}
                            type="checkbox"
                            value={day.value}
                            {...register('daysOfWeek')}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                          <label htmlFor={`day-${day.value}`} className="ml-2 block text-sm text-gray-700">
                            {day.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    {errors.daysOfWeek && (
                      <p className="mt-1 text-sm text-red-600">{errors.daysOfWeek.message}</p>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                      Start Time
                    </label>
                    <input
                      id="startTime"
                      type="time"
                      {...register('startTime')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.startTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                      End Time
                    </label>
                    <input
                      id="endTime"
                      type="time"
                      {...register('endTime')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.endTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pricing & Capacity */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Pricing & Capacity</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="pricePerStudent" className="block text-sm font-medium text-gray-700">
                      Price per Student ($)
                    </label>
                    <input
                      id="pricePerStudent"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('pricePerStudent')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.pricePerStudent && (
                      <p className="mt-1 text-sm text-red-600">{errors.pricePerStudent.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="maxCapacity" className="block text-sm font-medium text-gray-700">
                      Maximum Capacity
                    </label>
                    <input
                      id="maxCapacity"
                      type="number"
                      min="1"
                      {...register('maxCapacity')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.maxCapacity && (
                      <p className="mt-1 text-sm text-red-600">{errors.maxCapacity.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Settings */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Additional Settings</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Visibility
                  </label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="public"
                        type="radio"
                        value="true"
                        {...register('isPublic')}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <label htmlFor="public" className="ml-2 block text-sm text-gray-700">
                        Public (listed on the platform)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="private"
                        type="radio"
                        value="false"
                        {...register('isPublic')}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <label htmlFor="private" className="ml-2 block text-sm text-gray-700">
                        Private (only available via direct link)
                      </label>
                    </div>
                  </div>
                  {errors.isPublic && (
                    <p className="mt-1 text-sm text-red-600">{errors.isPublic.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tags (Categories)
                  </label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {tagOptions.map((tag) => (
                      <div key={tag} className="flex items-center">
                        <input
                          id={`tag-${tag}`}
                          type="checkbox"
                          value={tag}
                          {...register('tags')}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                        <label htmlFor={`tag-${tag}`} className="ml-2 block text-sm text-gray-700">
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.tags && (
                    <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/events/${id}`)}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateEvent.isLoading}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {updateEvent.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
