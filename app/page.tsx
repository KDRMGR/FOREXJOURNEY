import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      <nav className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                TradePro
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-300 hover:text-white transition">Features</Link>
              <Link href="#courses" className="text-gray-300 hover:text-white transition">Courses</Link>
              <Link href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</Link>
              <Link href="/auth/login" className="text-gray-300 hover:text-white transition">Login</Link>
              <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Master Crypto Trading
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
            Real-time signals, professional education, and advanced trading tools to dominate the crypto markets
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-lg font-semibold transition">
              Start Trading Now
            </Link>
            <Link href="#courses" className="bg-gray-800 hover:bg-gray-700 px-8 py-4 rounded-lg text-lg font-semibold transition">
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose TradePro</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 backdrop-blur p-8 rounded-xl border border-gray-700 hover:border-blue-500 transition">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Real-Time Signals</h3>
              <p className="text-gray-400">
                Get instant trading signals from expert analysts with entry, stop-loss, and take-profit levels
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-8 rounded-xl border border-gray-700 hover:border-cyan-500 transition">
              <div className="w-12 h-12 bg-cyan-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Advanced Charts</h3>
              <p className="text-gray-400">
                TradingView integration with real-time data from Binance and multiple technical indicators
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-8 rounded-xl border border-gray-700 hover:border-green-500 transition">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Expert Education</h3>
              <p className="text-gray-400">
                Learn from professional traders with comprehensive courses from beginner to advanced levels
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="courses" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Professional Trading Courses</h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            Master the markets with our structured curriculum designed by professional traders
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700">
              <div className="text-sm text-blue-400 font-semibold mb-2">BEGINNER</div>
              <h3 className="text-2xl font-bold mb-3">Crypto Fundamentals</h3>
              <p className="text-gray-400 mb-4">Learn the basics of cryptocurrency trading and blockchain technology</p>
              <div className="text-3xl font-bold mb-4">Free</div>
              <Link href="/auth/signup" className="block w-full bg-gray-700 hover:bg-gray-600 text-center py-3 rounded-lg transition">
                Start Learning
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-900 to-blue-950 p-6 rounded-xl border border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-xs px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="text-sm text-cyan-400 font-semibold mb-2">INTERMEDIATE</div>
              <h3 className="text-2xl font-bold mb-3">Technical Analysis Pro</h3>
              <p className="text-gray-400 mb-4">Master chart patterns, indicators, and trading strategies</p>
              <div className="text-3xl font-bold mb-4">$99/mo</div>
              <Link href="/auth/signup" className="block w-full bg-blue-600 hover:bg-blue-700 text-center py-3 rounded-lg transition">
                Get Started
              </Link>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700">
              <div className="text-sm text-green-400 font-semibold mb-2">ADVANCED</div>
              <h3 className="text-2xl font-bold mb-3">Algorithmic Trading</h3>
              <p className="text-gray-400 mb-4">Build automated trading bots and advanced strategies</p>
              <div className="text-3xl font-bold mb-4">$299/mo</div>
              <Link href="/auth/signup" className="block w-full bg-gray-700 hover:bg-gray-600 text-center py-3 rounded-lg transition">
                Go Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            Choose the plan that fits your trading goals
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="text-3xl font-bold mb-4">$0</div>
              <ul className="space-y-3 mb-6 text-gray-400">
                <li>Basic courses</li>
                <li>Community access</li>
                <li>Market data</li>
              </ul>
              <Link href="/auth/signup" className="block w-full bg-gray-700 hover:bg-gray-600 text-center py-3 rounded-lg transition">
                Get Started
              </Link>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold mb-2">Basic</h3>
              <div className="text-3xl font-bold mb-4">$49<span className="text-base text-gray-400">/mo</span></div>
              <ul className="space-y-3 mb-6 text-gray-400">
                <li>10 signals per week</li>
                <li>Intermediate courses</li>
                <li>Live charts</li>
              </ul>
              <Link href="/auth/signup" className="block w-full bg-blue-600 hover:bg-blue-700 text-center py-3 rounded-lg transition">
                Subscribe
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-900 to-blue-950 p-6 rounded-xl border border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-xs px-4 py-1 rounded-full">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Premium</h3>
              <div className="text-3xl font-bold mb-4">$99<span className="text-base text-gray-400">/mo</span></div>
              <ul className="space-y-3 mb-6">
                <li>Unlimited signals</li>
                <li>All courses</li>
                <li>Priority support</li>
              </ul>
              <Link href="/auth/signup" className="block w-full bg-blue-600 hover:bg-blue-700 text-center py-3 rounded-lg transition">
                Subscribe
              </Link>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-bold mb-2">VIP</h3>
              <div className="text-3xl font-bold mb-4">$299<span className="text-base text-gray-400">/mo</span></div>
              <ul className="space-y-3 mb-6 text-gray-400">
                <li>Copy trading</li>
                <li>1-on-1 coaching</li>
                <li>API access</li>
              </ul>
              <Link href="/auth/signup" className="block w-full bg-gray-700 hover:bg-gray-600 text-center py-3 rounded-lg transition">
                Go VIP
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 TradePro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
