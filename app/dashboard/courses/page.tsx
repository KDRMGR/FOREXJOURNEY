'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Course } from '@/lib/types/database';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (data) setCourses(data);
    setLoading(false);
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
      </div>

      <div className="flex gap-2 mb-8">
        {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              filter === level
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No courses available yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
              <div className="bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 transition overflow-hidden group cursor-pointer h-full">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center">
                    <span className="text-4xl opacity-30">◉</span>
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
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition mb-1">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{course.description}</p>
                  )}
                  <div className="mt-4">
                    <span className="text-sm font-medium text-blue-400 group-hover:underline">
                      Start Learning →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
