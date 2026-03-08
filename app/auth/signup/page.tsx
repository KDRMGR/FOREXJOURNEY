import Link from 'next/link';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            TradePro
          </Link>
          <h2 className="mt-6 text-3xl font-bold">Create Your Account</h2>
          <p className="mt-2 text-gray-400">Start your trading journey today</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-8">
          <SignupForm />

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-500 hover:text-blue-400">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
