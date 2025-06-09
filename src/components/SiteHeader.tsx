// src/components/SiteHeader.tsx
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/supabase/auth-context';

export default function SiteHeader() {
  const { user, signOut } = useAuth();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                Newsletter Builder
              </Link>
            </div>
            
            <nav className="ml-6 flex space-x-8">
              <Link to="/pricing" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Pricing
              </Link>
              
              {user && (
                <>
                  <Link to="/newsletter" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                    Newsletter
                  </Link>
                  <Link to="/research" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                    Research
                  </Link>
                  <Link to="/infographic" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                    Infographic
                  </Link>
                </>
              )}
            </nav>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
                  Profile
                </Link>
                <button
                  onClick={signOut}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}