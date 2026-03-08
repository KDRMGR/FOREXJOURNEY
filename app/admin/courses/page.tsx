'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Course, Lesson } from '@/lib/types/database';

const emptyCourseForm = {
  title: '',
  description: '',
  thumbnail_url: '',
  difficulty_level: 'beginner' as Course['difficulty_level'],
  price: '0',
};

const emptyLessonForm = {
  title: '',
  content: '',
  video_url: '',
  duration_minutes: '0',
  order_index: '1',
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [view, setView] = useState<'list' | 'create' | 'lessons'>('list');

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) setCourses(data);
    setLoading(false);
  };

  const fetchLessons = async (courseId: string) => {
    const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index');
    if (data) setLessons(data);
  };

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('courses').insert({
      ...courseForm,
      price: parseFloat(courseForm.price),
      created_by: user?.id,
      is_published: false,
    });

    if (!error) {
      setMsg('Course created!');
      setCourseForm(emptyCourseForm);
      fetchCourses();
      setView('list');
    } else {
      setMsg(error.message);
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const togglePublish = async (course: Course) => {
    await supabase.from('courses').update({ is_published: !course.is_published }).eq('id', course.id);
    setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, is_published: !c.is_published } : c));
  };

  const addLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setSaving(true);

    const { error } = await supabase.from('lessons').insert({
      course_id: selectedCourse.id,
      title: lessonForm.title,
      content: lessonForm.content || null,
      video_url: lessonForm.video_url || null,
      duration_minutes: parseInt(lessonForm.duration_minutes),
      order_index: parseInt(lessonForm.order_index),
    });

    if (!error) {
      setMsg('Lesson added!');
      setLessonForm(emptyLessonForm);
      fetchLessons(selectedCourse.id);
    } else {
      setMsg(error.message);
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const deleteLesson = async (lessonId: string) => {
    await supabase.from('lessons').delete().eq('id', lessonId);
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-950 border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Course Management</h1>
          <p className="text-sm text-gray-400">Create and manage educational content</p>
        </div>
        <div className="flex gap-3">
          {view !== 'list' && (
            <button onClick={() => setView('list')} className="text-sm text-gray-400 hover:text-white">← Back</button>
          )}
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white">Admin</Link>
        </div>
      </div>

      <div className="p-8">
        {msg && (
          <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm">{msg}</div>
        )}

        {view === 'list' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">All Courses ({courses.length})</h2>
              <button
                onClick={() => setView('create')}
                className="bg-purple-600 hover:bg-purple-700 px-5 py-2.5 rounded-lg font-semibold text-sm transition"
              >
                + New Course
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-800 rounded-xl h-20 animate-pulse" />)}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p>No courses yet. Create your first course!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div key={course.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-white">{course.title}</span>
                        <span className="text-xs text-gray-400 capitalize">{course.difficulty_level}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${course.is_published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-1">{course.description}</p>
                      <span className="text-sm font-semibold text-blue-400 mt-1 block">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          fetchLessons(course.id);
                          setView('lessons');
                        }}
                        className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm transition"
                      >
                        Lessons
                      </button>
                      <button
                        onClick={() => togglePublish(course)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition ${
                          course.is_published
                            ? 'bg-yellow-600/20 hover:bg-yellow-600 text-yellow-400 hover:text-white'
                            : 'bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white'
                        }`}
                      >
                        {course.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === 'create' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold mb-5">Create New Course</h2>
            <form onSubmit={createCourse} className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Title *</label>
                <input required value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Advanced Technical Analysis"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Description</label>
                <textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows={3} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Course description..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Thumbnail URL</label>
                <input value={courseForm.thumbnail_url} onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Difficulty</label>
                  <select value={courseForm.difficulty_level} onChange={(e) => setCourseForm({ ...courseForm, difficulty_level: e.target.value as Course['difficulty_level'] })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Price ($)</label>
                  <input type="number" min="0" step="any" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 py-3 rounded-lg font-bold transition">
                {saving ? 'Creating...' : 'Create Course'}
              </button>
            </form>
          </div>
        )}

        {view === 'lessons' && selectedCourse && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold mb-1">{selectedCourse.title}</h2>
              <p className="text-sm text-gray-400 mb-5">Manage lessons</p>

              {lessons.length === 0 ? (
                <p className="text-gray-400 text-sm">No lessons yet. Add the first one →</p>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, idx) => (
                    <div key={lesson.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 mr-2">#{lesson.order_index}</span>
                        <span className="font-medium text-white">{lesson.title}</span>
                        {lesson.duration_minutes > 0 && (
                          <span className="text-xs text-gray-400 ml-2">{lesson.duration_minutes}min</span>
                        )}
                      </div>
                      <button onClick={() => deleteLesson(lesson.id)} className="text-xs text-red-400 hover:text-red-300 ml-4">Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Add Lesson</h3>
              <form onSubmit={addLesson} className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Title *</label>
                  <input required value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Lesson title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Content</label>
                  <textarea value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    rows={4} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Lesson content..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Video URL</label>
                  <input value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Duration (min)</label>
                    <input type="number" min="0" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Order</label>
                    <input type="number" min="1" value={lessonForm.order_index} onChange={(e) => setLessonForm({ ...lessonForm, order_index: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-2.5 rounded-lg font-bold transition">
                  {saving ? 'Adding...' : 'Add Lesson'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
