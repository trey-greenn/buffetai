import React from 'react';
import { Menu, X } from 'lucide-react';

const SiteHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Home', href: '#', current: true },
    { name: 'Research Tool', href: '#research', current: false },
    { name: 'Newsletter', href: '#newsletter', current: false },
    { name: 'Infographic', href: '#infographic', current: false },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a href="#" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                BuffetAI
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`text-sm font-medium ${
                  item.current
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-900'
                } transition-colors duration-200`}
              >
                {item.name}
              </a>
            ))}
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Get Started
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`${
            isMenuOpen ? 'block' : 'hidden'
          } md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200`}
        >
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-base font-medium ${
                  item.current
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.name}
              </a>
            ))}
            <a
              href="#"
              className="block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-base font-medium text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-4"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default SiteHeader; 