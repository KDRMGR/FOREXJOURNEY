import Link from 'next/link';

const posts = [
  {
    slug: 'how-to-read-crypto-signals',
    title: 'How to Read Crypto Trading Signals Like a Pro',
    excerpt: 'Learn how to interpret entry price, stop-loss, and take-profit levels from a trading signal — and how to execute them safely on Binance.',
    category: 'Education',
    categoryColor: 'text-blue-400 bg-blue-400/10',
    date: 'March 5, 2026',
    readTime: '6 min read',
    author: 'TradePro Analysts',
  },
  {
    slug: 'bitcoin-technical-analysis-march-2026',
    title: 'Bitcoin Technical Analysis: Key Levels for March 2026',
    excerpt: 'BTC is consolidating near the $85K zone. We break down the support/resistance structure, RSI divergence, and what to watch next week.',
    category: 'Market Analysis',
    categoryColor: 'text-green-400 bg-green-400/10',
    date: 'March 3, 2026',
    readTime: '8 min read',
    author: 'TradePro Analysts',
  },
  {
    slug: 'risk-management-fundamentals',
    title: 'Risk Management: The Rule That Keeps Traders Alive',
    excerpt: 'The 1% rule, position sizing, and how to calculate your ideal trade size based on account balance. Most traders blow accounts ignoring this.',
    category: 'Education',
    categoryColor: 'text-blue-400 bg-blue-400/10',
    date: 'February 28, 2026',
    readTime: '5 min read',
    author: 'TradePro Analysts',
  },
  {
    slug: 'ethereum-merge-impact-2026',
    title: 'Ethereum in 2026: Why ETH is Outperforming the Market',
    excerpt: 'Institutional demand, L2 growth, and staking yields are all tailwinds for ETH. Here\'s our technical and fundamental case for the next rally.',
    category: 'Market Analysis',
    categoryColor: 'text-green-400 bg-green-400/10',
    date: 'February 25, 2026',
    readTime: '7 min read',
    author: 'TradePro Analysts',
  },
  {
    slug: 'binance-api-beginner-guide',
    title: 'Connecting Your Binance Account: A Step-by-Step Guide',
    excerpt: 'How to generate a read-only Binance API key, connect it to TradePro, and what permissions to enable for maximum security.',
    category: 'Tutorial',
    categoryColor: 'text-purple-400 bg-purple-400/10',
    date: 'February 20, 2026',
    readTime: '4 min read',
    author: 'TradePro Team',
  },
  {
    slug: 'copy-trading-explained',
    title: 'Copy Trading Explained: How VIP Members Earn on Autopilot',
    excerpt: 'Our VIP copy trading system mirrors expert trades directly into your connected account. Here\'s how it works and the results so far.',
    category: 'Feature',
    categoryColor: 'text-yellow-400 bg-yellow-400/10',
    date: 'February 15, 2026',
    readTime: '5 min read',
    author: 'TradePro Team',
  },
];

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            TradePro
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-gray-400 hover:text-white text-sm transition">Home</Link>
            <Link href="/auth/login" className="text-gray-400 hover:text-white text-sm transition">Login</Link>
            <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-3">TradePro Blog</h1>
          <p className="text-gray-400 text-lg">Market analysis, education, and platform updates from our team of professional traders.</p>
        </div>

        {/* Featured post */}
        <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/20 border border-blue-500/20 rounded-2xl p-8 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${featured.categoryColor}`}>
              {featured.category}
            </span>
            <span className="text-gray-400 text-sm">Featured</span>
          </div>
          <h2 className="text-3xl font-bold mb-3 hover:text-blue-400 transition cursor-pointer">
            {featured.title}
          </h2>
          <p className="text-gray-400 mb-6 text-lg leading-relaxed max-w-2xl">{featured.excerpt}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{featured.author}</span>
              <span>·</span>
              <span>{featured.date}</span>
              <span>·</span>
              <span>{featured.readTime}</span>
            </div>
            <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition">
              Read Article →
            </Link>
          </div>
        </div>

        {/* Post grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <div key={post.slug} className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition group">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${post.categoryColor}`}>
                  {post.category}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition leading-snug cursor-pointer">
                {post.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-700">
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 bg-gray-800/50 border border-gray-700 rounded-2xl p-10 text-center">
          <h3 className="text-2xl font-bold mb-2">Get Signals & Market Updates</h3>
          <p className="text-gray-400 mb-6">Join 2,400+ traders getting our weekly market analysis and signal recaps.</p>
          <Link href="/auth/signup" className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3.5 rounded-xl font-semibold transition">
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}
