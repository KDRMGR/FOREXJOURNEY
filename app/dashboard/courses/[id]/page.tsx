'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { Course, Lesson } from '@/lib/types/database';

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    const [{ data: courseData }, { data: lessonsData }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', id).single(),
      supabase.from('lessons').select('*').eq('course_id', id).order('order_index'),
    ]);

    if (courseData) setCourse(courseData);
    if (lessonsData) {
      setLessons(lessonsData);
      if (lessonsData.length > 0) setActiveLesson(lessonsData[0]);
    }

    if (user) {
      const { data: progressData } = await supabase
        .from('user_course_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id)
        .eq('course_id', id);

      if (progressData) setProgress(progressData);
    }

    setLoading(false);
  };

  const markComplete = async (lessonId: string) => {
    if (!user) return;

    await supabase.from('user_course_progress').upsert({
      user_id: user.id,
      course_id: id,
      lesson_id: lessonId,
      completed: true,
      progress_percentage: Math.round(
        ((progress.filter((p) => p.completed).length + 1) / lessons.length) * 100
      ),
      last_accessed_at: new Date().toISOString(),
    });

    setProgress((prev) => {
      const existing = prev.find((p) => p.lesson_id === lessonId);
      if (existing) return prev.map((p) => p.lesson_id === lessonId ? { ...p, completed: true } : p);
      return [...prev, { lesson_id: lessonId, completed: true }];
    });
  };

  const isCompleted = (lessonId: string) => progress.some((p) => p.lesson_id === lessonId && p.completed);
  const completedCount = progress.filter((p) => p.completed).length;
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-gray-800 rounded w-1/3 mb-4 animate-pulse" />
        <div className="h-4 bg-gray-800 rounded w-1/2 animate-pulse" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Course not found.</p>
        <Link href="/dashboard/courses" className="text-blue-400 mt-2 inline-block">Back to courses</Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Lesson sidebar */}
      <aside className="w-72 bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <Link href="/dashboard/courses" className="text-sm text-gray-400 hover:text-white mb-3 block">
            ← Back to Courses
          </Link>
          <h2 className="text-base font-bold text-white leading-tight">{course.title}</h2>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{completedCount}/{lessons.length} lessons</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {lessons.map((lesson, idx) => (
            <button
              key={lesson.id}
              onClick={() => setActiveLesson(lesson)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm ${
                activeLesson?.id === lesson.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  isCompleted(lesson.id) ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {isCompleted(lesson.id) ? '✓' : idx + 1}
                </span>
                <span className="flex-1 leading-tight">{lesson.title}</span>
              </div>
              {lesson.duration_minutes > 0 && (
                <span className="text-xs text-gray-500 ml-7">{lesson.duration_minutes} min</span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Lesson content */}
      <div className="flex-1 overflow-y-auto bg-gray-900 p-8">
        {activeLesson ? (
          <>
            <div className="max-w-3xl">
              <h1 className="text-2xl font-bold text-white mb-2">{activeLesson.title}</h1>
              {activeLesson.duration_minutes > 0 && (
                <p className="text-sm text-gray-400 mb-6">{activeLesson.duration_minutes} min read</p>
              )}

              {activeLesson.video_url && (
                <div className="mb-6 rounded-xl overflow-hidden bg-black aspect-video">
                  <iframe
                    src={activeLesson.video_url}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}

              {activeLesson.content && (
                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap mb-8">
                  {activeLesson.content}
                </div>
              )}

              <div className="flex items-center gap-4 pt-6 border-t border-gray-800">
                {!isCompleted(activeLesson.id) && (
                  <button
                    onClick={() => markComplete(activeLesson.id)}
                    className="bg-green-600 hover:bg-green-700 px-6 py-2.5 rounded-lg font-semibold text-sm transition"
                  >
                    Mark as Complete
                  </button>
                )}
                {isCompleted(activeLesson.id) && (
                  <span className="text-green-400 text-sm font-medium">✓ Completed</span>
                )}
                {lessons.indexOf(activeLesson) < lessons.length - 1 && (
                  <button
                    onClick={() => setActiveLesson(lessons[lessons.indexOf(activeLesson) + 1])}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-lg font-semibold text-sm transition"
                  >
                    Next Lesson →
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 mt-20">
            <p>Select a lesson to start learning</p>
          </div>
        )}
      </div>
    </div>
  );
}
