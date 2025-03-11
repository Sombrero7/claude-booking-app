import { useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Events', href: '/events' },
  { name: 'Spaces', href: '/spaces' },
  { name: 'How It Works', href: '/how-it-works' },
];

const userNavigation = {
  customer: [
    { name: 'My Bookings', href: '/dashboard/bookings' },
    { name: 'My Requests', href: '/dashboard/requests' },
    { name: 'Favorites', href: '/dashboard/favorites' },
    { name: 'Profile', href: '/profile' },
  ],
  provider: [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'My Events', href: '/dashboard/events' },
    { name: 'My Spaces', href: '/dashboard/spaces' },
    { name: 'Requests', href: '/dashboard/requests' },
    { name: 'Profile', href: '/profile' },
  ],
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Navbar: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const role = userProfile?.role || 'customer';
  const navItems = userNavigation[role as keyof typeof userNavigation] || userNavigation.customer;

  return (
    <Disclosure as="nav" className="bg-white shadow">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/" className="text-xl font-bold text-primary-600">
                    Booking Platform
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        router.pathname === item.href
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {currentUser ? (
                  <Menu as="div" className="ml-3 relative">
                    <div>
                      <Menu.Button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <span className="sr-only">Open user menu</span>
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                          {userProfile?.profile?.name?.charAt(0) || currentUser.email?.charAt(0)}
                        </div>
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                        <div className="px-4 py-2 border-b">
                          <p className="text-sm font-medium text-gray-900">
                            {userProfile?.profile?.name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500">{currentUser.email}</p>
                        </div>
                        
                        {navItems.map((item) => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <Link
                                href={item.href}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                {item.name}
                              </Link>
                            )}
                          </Menu.Item>
                        ))}
                        
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block w-full text-left px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/login"
                      className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    router.pathname === item.href
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800',
                    'block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                  )}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            {currentUser ? (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                      {userProfile?.profile?.name?.charAt(0) || currentUser.email?.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {userProfile?.profile?.name || 'User'}
                    </div>
                    <div className="text-sm font-medium text-gray-500">{currentUser.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {navItems.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                  <Disclosure.Button
                    as="button"
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Sign out
                  </Disclosure.Button>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex flex-col space-y-2 px-4">
                  <Link
                    href="/login"
                    className="text-center w-full py-2 text-gray-500 hover:text-gray-900 rounded-md text-base font-medium"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="text-center w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-base font-medium"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;