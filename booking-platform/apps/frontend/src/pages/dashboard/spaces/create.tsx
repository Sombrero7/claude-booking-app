import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from 'react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { spaceAPI } from '@/lib/api';

// Form validation schema
const schema = yup.object().shape({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  location: yup.object().shape({
    address: yup.string().required('Address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    zipCode: yup.string().required('Zip code is required'),
    country: yup.string().required('Country is required'),
  }),
  capacity: yup.number()
    .typeError('Capacity must be a number')
    .required('Capacity is required')
    .min(1, 'Capacity must be at least 1'),
  amenities: yup.array().of(yup.string()),
  pricing: yup.object().shape({
    hourlyRate: yup.number()
      .typeError('Hourly rate must be a number')
      .required('Hourly rate is required')
      .min(0, 'Hourly rate cannot be negative'),
    minimumHours: yup.number()
      .typeError('Minimum hours must be a number')
      .min(1, 'Minimum hours must be at least 1'),
    cleaningFee: yup.number()
      .typeError('Cleaning fee must be a number')
      .min(0, 'Cleaning fee cannot be negative'),
    currency: yup.string().required('Currency is required'),
  }),
  availability: yup.array().of(
    yup.object().shape({
      dayOfWeek: yup.string().required('Day of week is required'),
      startTime: yup.string().required('Start time is required'),
      endTime: yup.string().required('End time is required'),
    })
  ).min(1, 'At least one availability slot is required'),
  photos: yup.array().of(yup.string())
});

export default function CreateSpacePage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Setup react-hook-form
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      location: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
      },
      capacity: 1,
      amenities: [],
      pricing: {
        hourlyRate: 0,
        minimumHours: 1,
        cleaningFee: 0,
        currency: 'USD',
      },
      availability: [
        {
          dayOfWeek: 'Mon',
          startTime: '09:00',
          endTime: '17:00',
        }
      ],
      photos: []
    }
  });
  
  // Setup field array for availability slots
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'availability',
  });
  
  // Create space mutation
  const createSpace = useMutation(
    (data: any) => spaceAPI.createSpace(data),
    {
      onSuccess: (data) => {
        // Redirect to space details page
        const spaceId = data.data.data._id;
        router.push(`/dashboard/spaces/${spaceId}`);
      },
      onError: (error: any) => {
        setErrorMessage(error.response?.data?.error?.message || 'Failed to create space');
      }
    }
  );
  
  const onSubmit = async (formData: any) => {
    try {
      // Include photos in the form data
      formData.photos = photos;
      
      await createSpace.mutateAsync(formData);
    } catch (error) {
      // Error is handled by the mutation onError callback
    }
  };
  
  // Handle photo upload (in a real app, this would upload to a storage service)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // In a real app, you would upload these files to a storage service
    // For now, we'll simulate it by creating object URLs
    const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
    setPhotos([...photos, ...newPhotos]);
  };
  
  // Amenity options
  const amenityOptions = [
    'WiFi', 'Projector', 'Sound System', 'Air Conditioning',
    'Kitchen', 'Parking', 'Restrooms', 'Wheelchair Accessible',
    'Changing Rooms', 'Mirrors', 'Mats/Equipment', 'Outdoor Space'
  ];
  
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
  
  return (
    <ProtectedRoute roleRequired="provider">
      <DashboardLayout title="Create Space">
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
                    Space Name
                  </label>
                  <input
                    id="title"
                    type="text"
                    {...register('title')}
                    className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    placeholder="E.g., 'Downtown Yoga Studio'"
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
                    placeholder="Describe your space, its features, atmosphere, etc."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                    Maximum Capacity
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    min="1"
                    {...register('capacity')}
                    className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.capacity && (
                    <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Location */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Location</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="location.address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    id="location.address"
                    type="text"
                    {...register('location.address')}
                    className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                  />
                  {errors.location?.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="location.city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      id="location.city"
                      type="text"
                      {...register('location.city')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.location?.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="location.state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      id="location.state"
                      type="text"
                      {...register('location.state')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.location?.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.state.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="location.zipCode" className="block text-sm font-medium text-gray-700">
                      Zip Code
                    </label>
                    <input
                      id="location.zipCode"
                      type="text"
                      {...register('location.zipCode')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.location?.zipCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.zipCode.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="location.country" className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      id="location.country"
                      type="text"
                      {...register('location.country')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.location?.country && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.country.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pricing */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="pricing.hourlyRate" className="block text-sm font-medium text-gray-700">
                      Hourly Rate ($)
                    </label>
                    <input
                      id="pricing.hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('pricing.hourlyRate')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.pricing?.hourlyRate && (
                      <p className="mt-1 text-sm text-red-600">{errors.pricing.hourlyRate.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="pricing.currency" className="block text-sm font-medium text-gray-700">
                      Currency
                    </label>
                    <select
                      id="pricing.currency"
                      {...register('pricing.currency')}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                    </select>
                    {errors.pricing?.currency && (
                      <p className="mt-1 text-sm text-red-600">{errors.pricing.currency.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="pricing.minimumHours" className="block text-sm font-medium text-gray-700">
                      Minimum Hours
                    </label>
                    <input
                      id="pricing.minimumHours"
                      type="number"
                      min="1"
                      {...register('pricing.minimumHours')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.pricing?.minimumHours && (
                      <p className="mt-1 text-sm text-red-600">{errors.pricing.minimumHours.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="pricing.cleaningFee" className="block text-sm font-medium text-gray-700">
                      Cleaning Fee ($)
                    </label>
                    <input
                      id="pricing.cleaningFee"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('pricing.cleaningFee')}
                      className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.pricing?.cleaningFee && (
                      <p className="mt-1 text-sm text-red-600">{errors.pricing.cleaningFee.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Availability */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Availability</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label htmlFor={`availability.${index}.dayOfWeek`} className="block text-sm font-medium text-gray-700">
                          Day
                        </label>
                        <select
                          id={`availability.${index}.dayOfWeek`}
                          {...register(`availability.${index}.dayOfWeek`)}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          {daysOfWeek.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                        {errors.availability?.[index]?.dayOfWeek && (
                          <p className="mt-1 text-sm text-red-600">{errors.availability[index].dayOfWeek.message}</p>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <label htmlFor={`availability.${index}.startTime`} className="block text-sm font-medium text-gray-700">
                          Start Time
                        </label>
                        <input
                          id={`availability.${index}.startTime`}
                          type="time"
                          {...register(`availability.${index}.startTime`)}
                          className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                        />
                        {errors.availability?.[index]?.startTime && (
                          <p className="mt-1 text-sm text-red-600">{errors.availability[index].startTime.message}</p>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <label htmlFor={`availability.${index}.endTime`} className="block text-sm font-medium text-gray-700">
                          End Time
                        </label>
                        <input
                          id={`availability.${index}.endTime`}
                          type="time"
                          {...register(`availability.${index}.endTime`)}
                          className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                        />
                        {errors.availability?.[index]?.endTime && (
                          <p className="mt-1 text-sm text-red-600">{errors.availability[index].endTime.message}</p>
                        )}
                      </div>
                      
                      {fields.length > 1 && (
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="mt-1 p-2 text-gray-500 hover:text-red-500"
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => append({ dayOfWeek: 'Mon', startTime: '09:00', endTime: '17:00' })}
                    className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Time Slot
                  </button>
                  
                  {errors.availability && 'root' in errors.availability && (
                    <p className="mt-1 text-sm text-red-600">{errors.availability.root?.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Amenities */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Amenities</h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {amenityOptions.map((amenity) => (
                    <div key={amenity} className="flex items-center">
                      <input
                        id={`amenity-${amenity}`}
                        type="checkbox"
                        value={amenity}
                        {...register('amenities')}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                      <label htmlFor={`amenity-${amenity}`} className="ml-2 block text-sm text-gray-700">
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Photos */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Photos</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Photos
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="photos"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="photos"
                            name="photos"
                            type="file"
                            multiple
                            accept="image/*"
                            className="sr-only"
                            onChange={handlePhotoUpload}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
                
                {photos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Photos</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="h-24 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard/spaces')}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSpace.isLoading}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {createSpace.isLoading ? 'Creating...' : 'Create Space'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}