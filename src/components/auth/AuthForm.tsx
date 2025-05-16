// src/components/auth/AuthForm.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/supabase/auth-context';

export default function AuthForm() {
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up' | 'magic_link' | 'forgotten_password'>('sign_in');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      navigate('/newsletter');
    }
  }, [user, navigate]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {authView === 'sign_in' ? 'Sign In' : 
         authView === 'sign_up' ? 'Create Account' :
         authView === 'magic_link' ? 'Send Magic Link' : 'Reset Password'}
      </h2>
      
      <Auth
        supabaseClient={supabase}
        view={authView}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
        redirectTo={`${window.location.origin}/auth/callback`}
      />

      <div className="mt-6 flex justify-center space-x-4 text-sm">
        {authView !== 'sign_in' && (
          <button 
            onClick={() => setAuthView('sign_in')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Sign In
          </button>
        )}
        {authView !== 'sign_up' && (
          <button 
            onClick={() => setAuthView('sign_up')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Create Account
          </button>
        )}
        {authView !== 'forgotten_password' && (
          <button 
            onClick={() => setAuthView('forgotten_password')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Forgot Password
          </button>
        )}
      </div>
    </div>
  );
}