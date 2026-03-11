import Link from 'next/link';
import PriceTicker from '@/components/landing/PriceTicker';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="fixed top-0 w-full bg-gray-950/80 backdrop-blur-lg border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              TradePro
            </span>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-400 hover:text-white text-sm transition">Features</Link>
              <Link href="#courses" className="text-gray-400 hover:text-white text-sm transition">Courses</Link>
              <Link href="#pricing" className="text-gray-400 hover:text-white text-sm transition">Pricing</Link>
              <Link href="/blog" className="text-gray-400 hover:text-white text-sm transition">Blog</Link>
              <Link href="/auth/login" className="text-gray-400 hover:text-white text-sm transition">Login</Link>
              <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-sm font-semibold transition">
                Get Started
              </Link>
            </div>
            <div className="md:hidden flex gap-3">
              <Link href="/auth/login" className="text-sm text-gray-400 self-center">Login</Link>
              <Link href="/auth/signup" className="bg-blue-600 px-4 py-1.5 rounded-lg text-sm font-semibold">Start</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Live price ticker */}
      <div className="pt-16">
        <PriceTicker />
      </div>

      {/* Hero */}
      <section className="pt-20 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-cyan-900/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6 text-sm text-blue-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live signals broadcasting now
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Master Crypto
            </span>
            <br />
            <span className="text-white">Trading. Profitably.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Real-time signals, professional education, and live TradingView charts. Everything a serious trader needs in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-lg font-bold transition shadow-lg shadow-blue-600/25">
              Start Free Today
            </Link>
            <Link href="#features" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-8 py-4 rounded-xl text-lg font-semibold transition">
              See How It Works
            </Link>
          </div>
          {/* Platform stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: '2,400+', label: 'Active traders' },
              { value: '78%', label: 'Signal win rate' },
              { value: '500+', label: 'Signals delivered' },
              { value: '12', label: 'Course modules' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-gray-900/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-3">Everything You Need to Win</h2>
            <p className="text-gray-400 max-w-xl mx-auto">From beginner to advanced — our tools grow with you</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { color: 'bg-green-500', title: 'Real-Time Signals', desc: 'Instant BUY/SELL signals with entry, stop-loss, and take-profit. Pushed to your dashboard the moment our analysts act.' },
              { color: 'bg-blue-500', title: 'TradingView Charts', desc: 'Full TradingView integration with candlesticks, indicators (MA, RSI, MACD), and live Binance data for BTC, ETH, SOL and more.' },
              { color: 'bg-purple-500', title: 'Expert Education', desc: 'Structured courses from beginner to advanced. Video lessons, technical analysis, risk management, and algo trading.' },
              { color: 'bg-yellow-500', title: 'Instant Alerts', desc: 'Never miss a signal. Get in-app notifications the instant a new signal is published or a position hits TP/SL.' },
              { color: 'bg-red-500', title: 'Binance API Connect', desc: 'Securely connect your Binance account via read-only API keys to track your live portfolio alongside our signals.' },
              { color: 'bg-cyan-500', title: 'Copy Trading (VIP)', desc: 'Follow top traders automatically. VIP members mirror expert positions without manual execution.' },
            ].map((f) => (
              <div key={f.title} className="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6 hover:border-gray-600 transition">
                <div className={`w-11 h-11 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-3">Professional Trading Courses</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Built by professional traders with 10+ years of market experience</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { level: 'BEGINNER', levelColor: 'text-green-400', title: 'Crypto Fundamentals', desc: 'Blockchain basics, wallet setup, reading order books, understanding market cap and liquidity.', price: 'Free', priceColor: 'text-green-400', lessons: 8, popular: false },
              { level: 'INTERMEDIATE', levelColor: 'text-yellow-400', title: 'Technical Analysis Pro', desc: 'Chart patterns, RSI, MACD, Bollinger Bands, support/resistance, volume analysis and trade setups.', price: '$49/mo', priceColor: 'text-blue-400', lessons: 16, popular: true },
              { level: 'ADVANCED', levelColor: 'text-red-400', title: 'Algorithmic Trading', desc: 'Build trading bots, backtesting strategies, API integration with Binance, risk management at scale.', price: '$99/mo', priceColor: 'text-purple-400', lessons: 24, popular: false },
            ].map((c) => (
              <div key={c.title} className={`bg-gray-800/80 rounded-2xl border p-6 relative ${c.popular ? 'border-blue-500' : 'border-gray-700'}`}>
                {c.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className={`text-xs font-bold mb-3 ${c.levelColor}`}>{c.level}</div>
                <h3 className="text-xl font-bold mb-2">{c.title}</h3>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">{c.desc}</p>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm text-gray-400">{c.lessons} lessons</span>
                  <span className={`text-2xl font-extrabold ${c.priceColor}`}>{c.price}</span>
                </div>
                <Link href="/auth/signup" className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition ${c.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
                  {c.price === 'Free' ? 'Start for Free' : 'Enroll Now'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-900/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-3">Traders Love TradePro</h2>
            <p className="text-gray-400">Real results from real members</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Marcus T.', role: 'Full-time trader', tier: 'Premium', text: 'The signals are incredibly accurate. I\'ve been using TradePro for 4 months and my win rate jumped from 45% to 72%. Worth every penny.', profit: '+$12,400' },
              { name: 'Sarah K.', role: 'Crypto investor', tier: 'Basic', text: 'Finally a platform that teaches you WHY to trade, not just WHAT to trade. The Technical Analysis course completely changed how I read charts.', profit: '+$4,200' },
              { name: 'David O.', role: 'Algorithmic trader', tier: 'VIP', text: 'Copy trading is a game changer. I connected my Binance API and my portfolio now runs on autopilot. The VIP tier pays for itself every month.', profit: '+$31,000' },
            ].map((t) => (
              <div key={t.name} className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role} · {t.tier}</div>
                  </div>
                  <div className="text-green-400 font-bold text-sm">{t.profit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-3">Simple, Transparent Pricing</h2>
            <p className="text-gray-400">No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {[
              { name: 'Free', price: '$0', period: '', color: 'border-gray-700', features: ['3 signal preview', 'Beginner courses', 'Live charts', 'Community access'], cta: 'Get Started', ctaStyle: 'bg-gray-700 hover:bg-gray-600' },
              { name: 'Basic', price: '$49', period: '/mo', color: 'border-gray-700', features: ['10 signals/week', 'Intermediate courses', 'Signal history', 'Email alerts'], cta: 'Subscribe', ctaStyle: 'bg-blue-600 hover:bg-blue-700' },
              { name: 'Premium', price: '$99', period: '/mo', color: 'border-blue-500', popular: true, features: ['Unlimited signals', 'All courses', 'Advanced courses', 'Priority support'], cta: 'Go Premium', ctaStyle: 'bg-blue-600 hover:bg-blue-700' },
              { name: 'VIP', price: '$299', period: '/mo', color: 'border-yellow-500/50', features: ['Everything in Premium', 'Copy trading', '1-on-1 coaching', 'API access'], cta: 'Go VIP', ctaStyle: 'bg-yellow-600 hover:bg-yellow-700' },
            ].map((plan) => (
              <div key={plan.name} className={`bg-gray-800/80 rounded-2xl border p-6 relative ${plan.color}`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-xs font-bold px-4 py-1 rounded-full">
                    POPULAR
                  </div>
                )}
                <div className="font-bold text-lg mb-1">{plan.name}</div>
                <div className="text-4xl font-extrabold mb-5">
                  {plan.price}<span className="text-base font-normal text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition ${plan.ctaStyle}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/30 border border-blue-500/20 rounded-3xl p-12">
            <h2 className="text-4xl font-extrabold mb-4">Ready to Start Profiting?</h2>
            <p className="text-gray-400 mb-8 text-lg">Join thousands of traders using TradePro signals and education.</p>
            <Link href="/auth/signup" className="inline-block bg-blue-600 hover:bg-blue-700 px-10 py-4 rounded-xl text-lg font-bold transition shadow-lg shadow-blue-600/30">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent mb-3">TradePro</div>
              <p className="text-gray-400 text-sm">Professional crypto trading signals, education, and tools.</p>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3 text-gray-300">Platform</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3 text-gray-300">Account</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/auth/login" className="hover:text-white transition">Login</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition">Sign Up</Link></li>
                <li><Link href="/auth/forgot-password" className="hover:text-white transition">Reset Password</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3 text-gray-300">Legal</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><span>Risk Disclaimer</span></li>
                <li><span>Privacy Policy</span></li>
                <li><span>Terms of Service</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">&copy; 2026 TradePro. All rights reserved.</p>
            <p className="text-gray-600 text-xs text-center">Trading involves significant risk. Past performance is not indicative of future results.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
