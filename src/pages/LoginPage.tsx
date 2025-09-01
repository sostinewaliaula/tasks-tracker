import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserIcon, LockIcon } from 'lucide-react';
type LoginPageProps = {
  onLogin: (role: string) => void;
};
export function LoginPage({
  onLogin
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const {
    login
  } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      onLogin(email.includes('manager') ? 'manager' : 'employee');
    } catch (err) {
      setError('Invalid email or password');
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-[#e8f5f0] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Caava Group
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Task Tracking System
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] focus:z-10 sm:text-sm" placeholder="Email address" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] focus:z-10 sm:text-sm" placeholder="Password" />
              </div>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <div>
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74]">
              Sign in
            </button>
          </div>
          <div className="text-sm text-center text-gray-500">
            <p>For demo purposes:</p>
            <p>Employee: employee@caava.com / password</p>
            <p>Manager: manager@caava.com / password</p>
          </div>
        </form>
      </div>
    </div>;
}