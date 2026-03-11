'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Course, Lesson, LessonType, Quiz } from '@/lib/types/database';

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const LESSON_TYPES: { value: LessonType; label: string; icon: string }[] = [
  { value: 'text',    label: 'Text Article', icon: '📝' },
  { value: 'youtube', label: 'YouTube Video', icon: '▶️' },
  { value: 'pdf',     label: 'PDF Document', icon: '📄' },
  { value: 'audio',   label: 'Audio Lesson', icon: '🎧' },
  { value: 'quiz',    label: 'Quiz',         icon: '✅' },
];

const emptyCourseForm = {
  title: '', description: '', thumbnail_url: '',
  difficulty_level: 'beginner' as Course['difficulty_level'], price: '0',
};
const emptyLessonForm = {
  title: '', content: '', lesson_type: 'text' as LessonType,
  youtube_embed_id: '', pdf_url: '', audio_url: '', video_url: '',
  duration_minutes: '10', order_index: '1', is_free: false,
};

function extractYouTubeId(input: string): string {
  const match = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : input.trim();
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [view, setView] = useState<'list' | 'create' | 'lessons'>('list');
  const [aiTopic, setAiTopic] = useState('');
  const [quizForm, setQuizForm] = useState({ question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' });
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  useEffect(() => { fetchCourses(); }, []);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) setCourses(data);
    setLoading(false);
  };

  const fetchLessons = async (courseId: string) => {
    const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index');
    if (data) setLessons(data as Lesson[]);
  };

  const fetchQuizzes = async (lessonId: string) => {
    const { data } = await supabase.from('quizzes').select('*').eq('lesson_id', lessonId).order('order_index');
    if (data) setQuizzes(data as Quiz[]);
  };

  // ── AI: Generate full course outline ────────────────────────────────────────
  const generateCourseOutline = async () => {
    if (!aiTopic) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, level: courseForm.difficulty_level, type: 'course_outline' }),
      });
      const data = await res.json();
      if (data.title) {
        setCourseForm((f) => ({ ...f, title: data.title, description: data.description || f.description }));
        showMsg(`AI generated outline with ${data.lessons?.length ?? 0} lessons. Review and save the course first, then add lessons.`);
      }
    } catch { showMsg('AI generation failed', 'error'); }
    setAiLoading(false);
  };

  // ── AI: Generate lesson content ──────────────────────────────────────────────
  const generateLessonContent = async () => {
    if (!lessonForm.title) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: lessonForm.title,
          level: selectedCourse?.difficulty_level ?? 'beginner',
          type: 'lesson_content',
        }),
      });
      const data = await res.json();
      if (data.content) {
        setLessonForm((f) => ({ ...f, content: data.content }));
        showMsg('AI generated lesson content. Review and save.');
      }
    } catch { showMsg('AI generation failed', 'error'); }
    setAiLoading(false);
  };

  // ── AI: Generate quiz questions ──────────────────────────────────────────────
  const generateQuiz = async (lesson: Lesson) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: lesson.title, level: selectedCourse?.difficulty_level ?? 'beginner', type: 'quiz' }),
      });
      const data = await res.json();
      if (data.questions?.length > 0) {
        const toInsert = data.questions.map((q: Quiz, i: number) => ({
          lesson_id: lesson.id,
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation ?? null,
          order_index: i,
        }));
        await supabase.from('quizzes').insert(toInsert);
        showMsg(`${toInsert.length} quiz questions generated and saved!`);
        fetchQuizzes(lesson.id);
      }
    } catch { showMsg('Quiz generation failed', 'error'); }
    setAiLoading(false);
  };

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('courses').insert({
      ...courseForm, price: parseFloat(courseForm.price),
      created_by: user?.id, is_published: false,
    });
    if (!error) { showMsg('Course created!'); setCourseForm(emptyCourseForm); fetchCourses(); setView('list'); }
    else showMsg(error.message, 'error');
    setSaving(false);
  };

  const togglePublish = async (course: Course) => {
    await supabase.from('courses').update({ is_published: !course.is_published }).eq('id', course.id);
    setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, is_published: !c.is_published } : c));
  };

  const addLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setSaving(true);

    const embedId = lessonForm.lesson_type === 'youtube'
      ? extractYouTubeId(lessonForm.youtube_embed_id)
      : null;

    const payload = {
      course_id: selectedCourse.id,
      title: lessonForm.title,
      content: lessonForm.content || null,
      lesson_type: lessonForm.lesson_type,
      youtube_embed_id: embedId,
      pdf_url: lessonForm.pdf_url || null,
      audio_url: lessonForm.audio_url || null,
      video_url: lessonForm.video_url || null,
      duration_minutes: parseInt(lessonForm.duration_minutes),
      order_index: parseInt(lessonForm.order_index),
      is_free: lessonForm.is_free,
    };

    const { error } = editingLesson
      ? await supabase.from('lessons').update(payload).eq('id', editingLesson.id)
      : await supabase.from('lessons').insert(payload);

    if (!error) {
      showMsg(editingLesson ? 'Lesson updated!' : 'Lesson added!');
      setLessonForm(emptyLessonForm);
      setEditingLesson(null);
      fetchLessons(selectedCourse.id);
    } else showMsg(error.message, 'error');
    setSaving(false);
  };

  const deleteLesson = async (lessonId: string) => {
    await supabase.from('lessons').delete().eq('id', lessonId);
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
  };

  const deleteQuiz = async (quizId: string, lessonId: string) => {
    await supabase.from('quizzes').delete().eq('id', quizId);
    fetchQuizzes(lessonId);
  };

  const addQuizQuestion = async (lessonId: string) => {
    if (!quizForm.question || quizForm.options.some((o) => !o)) return;
    await supabase.from('quizzes').insert({ lesson_id: lessonId, ...quizForm, order_index: quizzes.length });
    setQuizForm({ question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' });
    fetchQuizzes(lessonId);
    showMsg('Question added!');
  };

  const lessonTypeIcon = (t: LessonType) => LESSON_TYPES.find((l) => l.value === t)?.icon ?? '📝';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-950 border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Course Management</h1>
          <p className="text-sm text-gray-400">Create AI-powered educational content</p>
        </div>
        <div className="flex gap-3">
          {view !== 'list' && <button onClick={() => { setView('list'); setEditingLesson(null); }} className="text-sm text-gray-400 hover:text-white">← Back</button>}
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white">Admin</Link>
        </div>
      </div>

      <div className="p-8">
        {msg && (
          <div className={`mb-6 p-3 border rounded-lg text-sm ${msgType === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {msg}
          </div>
        )}

        {/* ── Course List ── */}
        {view === 'list' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">All Courses ({courses.length})</h2>
              <button onClick={() => setView('create')} className="bg-purple-600 hover:bg-purple-700 px-5 py-2.5 rounded-lg font-semibold text-sm transition">
                + New Course
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-gray-800 rounded-xl h-20 animate-pulse" />)}</div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20 text-gray-400"><p>No courses yet. Create your first course!</p></div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div key={course.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {course.thumbnail_url && (
                        <img src={course.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-white">{course.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold capitalize ${
                            course.difficulty_level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                            course.difficulty_level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>{course.difficulty_level}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${course.is_published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-600/40 text-gray-400'}`}>
                            {course.is_published ? '● Published' : '○ Draft'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-1">{course.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setSelectedCourse(course); fetchLessons(course.id); setView('lessons'); }}
                        className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm transition"
                      >
                        Lessons
                      </button>
                      <button
                        onClick={() => togglePublish(course)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition ${course.is_published ? 'bg-yellow-600/20 hover:bg-yellow-600 text-yellow-400 hover:text-white' : 'bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white'}`}
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

        {/* ── Create Course ── */}
        {view === 'create' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold mb-5">Create New Course</h2>

            {/* AI outline generator */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5 mb-6">
              <p className="text-sm font-semibold text-purple-400 mb-3">✨ AI Course Generator</p>
              <div className="flex gap-3">
                <input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Technical Analysis for Crypto"
                  className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <button
                  onClick={generateCourseOutline}
                  disabled={aiLoading || !aiTopic}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
                >
                  {aiLoading ? 'Generating...' : 'Generate Outline'}
                </button>
              </div>
            </div>

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
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Level</label>
                  <select value={courseForm.difficulty_level} onChange={(e) => setCourseForm({ ...courseForm, difficulty_level: e.target.value as Course['difficulty_level'] })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DIFFICULTY_LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Price ($) — 0 = Free</label>
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

        {/* ── Lessons Manager ── */}
        {view === 'lessons' && selectedCourse && (
          <div className="grid xl:grid-cols-5 gap-8">
            {/* Lesson list */}
            <div className="xl:col-span-3">
              <h2 className="text-xl font-bold mb-1">{selectedCourse.title}</h2>
              <p className="text-sm text-gray-400 mb-5 capitalize">{selectedCourse.difficulty_level} · {lessons.length} lessons</p>

              {lessons.length === 0 ? (
                <p className="text-gray-400 text-sm">No lessons yet. Add the first one →</p>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-lg">{lessonTypeIcon(lesson.lesson_type)}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white truncate">{lesson.title}</span>
                              {lesson.is_free && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">FREE</span>}
                            </div>
                            <span className="text-xs text-gray-500 capitalize">{lesson.lesson_type} · {lesson.duration_minutes}min</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => { setEditingLesson(lesson); setLessonForm({ title: lesson.title, content: lesson.content ?? '', lesson_type: lesson.lesson_type, youtube_embed_id: lesson.youtube_embed_id ?? '', pdf_url: lesson.pdf_url ?? '', audio_url: lesson.audio_url ?? '', video_url: lesson.video_url ?? '', duration_minutes: String(lesson.duration_minutes), order_index: String(lesson.order_index), is_free: lesson.is_free }); }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Edit
                          </button>
                          {lesson.lesson_type === 'quiz' && (
                            <button
                              onClick={() => { setEditingLesson(lesson); fetchQuizzes(lesson.id); }}
                              className="text-xs text-purple-400 hover:text-purple-300"
                            >
                              Quiz
                            </button>
                          )}
                          <button onClick={() => deleteLesson(lesson.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                        </div>
                      </div>

                      {/* Quiz manager inline */}
                      {lesson.lesson_type === 'quiz' && editingLesson?.id === lesson.id && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-300">Quiz Questions ({quizzes.length})</p>
                            <button
                              onClick={() => generateQuiz(lesson)}
                              disabled={aiLoading}
                              className="text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-3 py-1.5 rounded-lg transition"
                            >
                              {aiLoading ? 'Generating...' : '✨ AI Generate'}
                            </button>
                          </div>
                          {quizzes.map((q, qi) => (
                            <div key={q.id} className="bg-gray-900 rounded-lg p-3 mb-2 text-sm">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-white">Q{qi + 1}: {q.question}</p>
                                <button onClick={() => deleteQuiz(q.id, lesson.id)} className="text-xs text-red-400 flex-shrink-0">×</button>
                              </div>
                              <div className="grid grid-cols-2 gap-1 mt-1">
                                {q.options.map((opt, i) => (
                                  <span key={i} className={`text-xs px-2 py-1 rounded ${i === q.correct_index ? 'bg-green-500/20 text-green-400' : 'text-gray-400'}`}>
                                    {String.fromCharCode(65 + i)}. {opt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                          {/* Add manual question */}
                          <div className="mt-3 space-y-2">
                            <input value={quizForm.question} onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
                              placeholder="Question..." className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none" />
                            <div className="grid grid-cols-2 gap-2">
                              {quizForm.options.map((opt, i) => (
                                <input key={i} value={opt} onChange={(e) => { const o = [...quizForm.options]; o[i] = e.target.value; setQuizForm({ ...quizForm, options: o }); }}
                                  placeholder={`Option ${String.fromCharCode(65 + i)}`} className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none" />
                              ))}
                            </div>
                            <div className="flex items-center gap-3">
                              <select value={quizForm.correct_index} onChange={(e) => setQuizForm({ ...quizForm, correct_index: parseInt(e.target.value) })}
                                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm outline-none">
                                {['A', 'B', 'C', 'D'].map((l, i) => <option key={i} value={i}>Correct: {l}</option>)}
                              </select>
                              <button onClick={() => addQuizQuestion(lesson.id)} className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition">Add Question</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add/Edit lesson form */}
            <div className="xl:col-span-2">
              <h3 className="text-lg font-bold mb-4">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h3>
              <form onSubmit={addLesson} className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
                {/* Lesson type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LESSON_TYPES.map((lt) => (
                      <button key={lt.value} type="button"
                        onClick={() => setLessonForm({ ...lessonForm, lesson_type: lt.value })}
                        className={`p-2 rounded-lg text-xs font-medium text-center transition ${lessonForm.lesson_type === lt.value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                      >
                        <div>{lt.icon}</div>
                        <div>{lt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Title *</label>
                  <input required value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="Lesson title" />
                </div>

                {/* YouTube URL */}
                {lessonForm.lesson_type === 'youtube' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">YouTube URL or Video ID</label>
                    <input value={lessonForm.youtube_embed_id} onChange={(e) => setLessonForm({ ...lessonForm, youtube_embed_id: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://youtube.com/watch?v=... or video ID" />
                    <p className="text-xs text-gray-500 mt-1">Paste full YouTube URL — video ID will be extracted automatically</p>
                  </div>
                )}

                {/* PDF URL */}
                {lessonForm.lesson_type === 'pdf' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">PDF URL</label>
                    <input value={lessonForm.pdf_url} onChange={(e) => setLessonForm({ ...lessonForm, pdf_url: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                  </div>
                )}

                {/* Audio URL */}
                {lessonForm.lesson_type === 'audio' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Audio URL</label>
                    <input value={lessonForm.audio_url} onChange={(e) => setLessonForm({ ...lessonForm, audio_url: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                  </div>
                )}

                {/* Text content + AI */}
                {(lessonForm.lesson_type === 'text' || lessonForm.lesson_type === 'youtube' || lessonForm.lesson_type === 'pdf') && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase">
                        {lessonForm.lesson_type === 'text' ? 'Content *' : 'Notes / Description'}
                      </label>
                      {lessonForm.lesson_type === 'text' && (
                        <button type="button" onClick={generateLessonContent} disabled={aiLoading || !lessonForm.title}
                          className="text-xs bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white px-2.5 py-1 rounded-lg transition disabled:opacity-50">
                          {aiLoading ? '...' : '✨ AI Write'}
                        </button>
                      )}
                    </div>
                    <textarea value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                      rows={6} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                      placeholder={lessonForm.lesson_type === 'text' ? 'Lesson content (or click AI Write)...' : 'Optional description...'}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Duration (min)</label>
                    <input type="number" min="0" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Order</label>
                    <input type="number" min="1" value={lessonForm.order_index} onChange={(e) => setLessonForm({ ...lessonForm, order_index: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={lessonForm.is_free} onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.checked })}
                    className="w-4 h-4 rounded accent-green-500" />
                  <span className="text-sm text-gray-300">Free lesson (visible to all tiers)</span>
                </label>

                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-2.5 rounded-lg font-bold transition">
                    {saving ? 'Saving...' : editingLesson ? 'Update Lesson' : 'Add Lesson'}
                  </button>
                  {editingLesson && (
                    <button type="button" onClick={() => { setEditingLesson(null); setLessonForm(emptyLessonForm); }}
                      className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition text-sm">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
