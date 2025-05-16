import { Link } from 'react-router-dom';
import { useAuth } from '../lib/supabase/auth-context';

export default function HomePage() {
  const { user } = useAuth();
  
  return (
    <div className="max-w-5xl mx-auto text-center">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-8">
        Newsletter Builder
      </h1>
      <p className="text-xl text-gray-600 mb-10">
        Create custom newsletters with automated content delivery on your schedule.
      </p>
      
      <div className="flex flex-col items-center space-y-6">
        {user ? (
          <div className="space-y-6">
            <p className="text-indigo-600">Welcome back, {user.email}</p>
            <Link 
              to="/newsletter" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Newsletter Builder
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <p>Sign in to create and manage your newsletters</p>
            <Link 
              to="/login" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}