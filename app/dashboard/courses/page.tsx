'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { Course, SubscriptionTier } from '@/lib/types/database';

// Which tier unlocks each difficulty
const difficultyRequirement: Record<string, SubscriptionTier> = {
  beginner: 'free',
  intermediate: 'basic',
  advanced: 'premium',
};

const tierRank: Record<SubscriptionTier, number> = {
  free: 0, basic: 1, premium: 2, vip: 3, vvip: 4,
};

const tierLabel: Record<SubscriptionTier, string> = {
  free: 'Free', basic: 'Basic', premium: 'Premium', vip: 'VIP', vvip: 'VVIP',
};

export default function CoursesPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const tier = user?.subscription_tier ?? 'free';

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (data) setCourses(data);
    setLoading(false);
  };

  const canAccess = (level: string) => {
    const required = difficultyRequirement[level] ?? 'free';
    return tierRank[tier] >= tierRank[required];
  };

  const filtered = filter === 'all' ? courses : courses.filter((c) => c.difficulty_level === filter);

  const difficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'advanced': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Courses</h1>
        <p className="text-gray-400">Master trading with our professional curriculum</p>

        {/* Access legend */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Beginner — Free</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Intermediate — Basic+</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Advanced — Premium+</span>
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              filter === level ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-800 rounded-xl h-64 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No courses available yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => {
            const accessible = canAccess(course.difficulty_level);
            const required = difficultyRequirement[course.difficulty_level];

            const card = (
              <div className={`bg-gray-800 rounded-xl border overflow-hidden group h-full transition ${
                accessible ? 'border-gray-700 hover:border-blue-500 cursor-pointer' : 'border-gray-700 opacity-75'
              }`}>
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    width={800}
                    height={160}
                    className="w-full h-40 object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center">
                    {accessible ? (
                      <span className="text-4xl opacity-30">◉</span>
                    ) : (
                      <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded border ${difficultyColor(course.difficulty_level)}`}>
                      {course.difficulty_level}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </span>
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${accessible ? 'text-white group-hover:text-blue-400' : 'text-gray-400'} transition`}>
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{course.description}</p>
                  )}
                  <div className="mt-4">
                    {accessible ? (
                      <span className="text-sm font-medium text-blue-400 group-hover:underline">
                        Start Learning →
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Requires {tierLabel[required]} plan
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );

            return accessible ? (
              <Link key={course.id} href={`/dashboard/courses/${course.id}`}>{card}</Link>
            ) : (
              <Link key={course.id} href="/dashboard/profile">{card}</Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
