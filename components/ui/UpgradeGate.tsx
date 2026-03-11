import Link from 'next/link';
import { SubscriptionTier } from '@/lib/types/database';

interface Props {
  currentTier: SubscriptionTier;
  requiredTier: SubscriptionTier;
  feature: string;
  children: React.ReactNode;
}

const tierRank: Record<SubscriptionTier, number> = {
  free: 0, basic: 1, premium: 2, vip: 3, vvip: 4,
};

const tierColor: Record<SubscriptionTier, string> = {
  free: 'text-gray-400', basic: 'text-blue-400',
  premium: 'text-purple-400', vip: 'text-yellow-400', vvip: 'text-orange-400',
};

export function UpgradeGate({ currentTier, requiredTier, feature, children }: Props) {
  const hasAccess = tierRank[currentTier] >= tierRank[requiredTier];

  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gray-900/95 border border-gray-700 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
          <div className="w-14 h-14 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{feature}</h3>
          <p className="text-gray-400 text-sm mb-1">
            Your current plan: <span className={`font-semibold uppercase ${tierColor[currentTier]}`}>{currentTier}</span>
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Requires: <span className={`font-semibold uppercase ${tierColor[requiredTier]}`}>{requiredTier}</span> or higher
          </p>
          <Link
            href="/dashboard/profile"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition text-sm"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  );
}
