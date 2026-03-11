'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { Course, Lesson, Quiz, QuizScore } from '@/lib/types/database';

interface LessonProgress { lesson_id: string; completed: boolean; }

const LESSON_TYPE_ICON: Record<string, string> = {
  text: '📝', youtube: '▶', pdf: '📄', audio: '🎧', quiz: '✅',
};

function QuizPlayer({ lesson, userId, onComplete }: { lesson: Lesson; userId: string; onComplete: () => void }) {
  const [questions, setQuestions] = useState<Quiz[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [existing, setExisting] = useState<QuizScore | null>(null);

  useEffect(() => {
    supabase.from('quizzes').select('*').eq('lesson_id', lesson.id).order('order_index')
      .then(({ data }) => { if (data) setQuestions(data as Quiz[]); });
    supabase.from('quiz_scores').select('*').eq('user_id', userId).eq('lesson_id', lesson.id).maybeSingle()
      .then(({ data }) => { if (data) { setExisting(data as QuizScore); setSubmitted(true); setScore(data.score); } });
  }, [lesson.id, userId]);

  const submitQuiz = async () => {
    let correct = 0;
    questions.forEach((q) => { if (answers[q.id] === q.correct_index) correct++; });
    setScore(correct);
    setSubmitted(true);
    await supabase.from('quiz_scores').upsert({ user_id: userId, lesson_id: lesson.id, score: correct, total: questions.length });
    if (correct / questions.length >= 0.7) onComplete();
  };

  if (questions.length === 0) return <p className="text-gray-400 text-sm">No quiz questions yet.</p>;

  const pct = Math.round((score / questions.length) * 100);
  const passed = pct >= 70;

  return (
    <div className="space-y-6">
      {submitted && (
        <div className={`p-4 rounded-xl border ${passed ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <p className={`text-lg font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
            {passed ? '🎉 Passed!' : '❌ Try Again'} — {score}/{questions.length} ({pct}%)
          </p>
          {existing && <p className="text-sm text-gray-400 mt-1">Previously scored: {existing.score}/{existing.total}</p>}
        </div>
      )}

      {questions.map((q, qi) => {
        const selected = answers[q.id];
        const isCorrect = submitted && selected === q.correct_index;
        const isWrong   = submitted && selected !== undefined && selected !== q.correct_index;

        return (
          <div key={q.id} className={`bg-gray-800 rounded-xl p-5 border ${submitted ? (isCorrect ? 'border-green-500/30' : isWrong ? 'border-red-500/30' : 'border-gray-700') : 'border-gray-700'}`}>
            <p className="font-medium text-white mb-4">Q{qi + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                let cls = 'border-gray-600 text-gray-300 hover:border-blue-500 hover:text-white';
                if (!submitted && selected === i) cls = 'border-blue-500 bg-blue-500/10 text-white';
                if (submitted && i === q.correct_index) cls = 'border-green-500 bg-green-500/10 text-green-400';
                if (submitted && selected === i && i !== q.correct_index) cls = 'border-red-500 bg-red-500/10 text-red-400';

                return (
                  <button key={i} disabled={submitted} onClick={() => setAnswers({ ...answers, [q.id]: i })}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition ${cls}`}>
                    <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <p className="text-xs text-gray-400 mt-3 italic">💡 {q.explanation}</p>
            )}
          </div>
        );
      })}

      {!submitted && (
        <button onClick={submitQuiz}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-60 py-3 rounded-xl font-bold transition">
          Submit Answers ({Object.keys(answers).length}/{questions.length} answered)
        </button>
      )}
      {submitted && !passed && (
        <button onClick={() => { setAnswers({}); setSubmitted(false); }}
          className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-bold transition">
          Retry Quiz
        </button>
      )}
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) fetchCourse(); }, [id]);

  const fetchCourse = async () => {
    const [{ data: courseData }, { data: lessonsData }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', id).single(),
      supabase.from('lessons').select('*').eq('course_id', id).order('order_index'),
    ]);
    if (courseData) setCourse(courseData);
    if (lessonsData) {
      setLessons(lessonsData as Lesson[]);
      if (lessonsData.length > 0) setActiveLesson(lessonsData[0] as Lesson);
    }
    if (user) {
      const { data: progressData } = await supabase
        .from('user_course_progress').select('lesson_id, completed')
        .eq('user_id', user.id).eq('course_id', id);
      if (progressData) setProgress(progressData);
    }
    setLoading(false);
  };

  const markComplete = async (lessonId: string) => {
    if (!user) return;
    const newCompleted = progress.filter((p) => p.completed).length + 1;
    await supabase.from('user_course_progress').upsert({
      user_id: user.id, course_id: id, lesson_id: lessonId,
      completed: true,
      progress_percentage: Math.round((newCompleted / lessons.length) * 100),
      last_accessed_at: new Date().toISOString(),
    });
    setProgress((prev) => {
      const existing = prev.find((p) => p.lesson_id === lessonId);
      if (existing) return prev.map((p) => p.lesson_id === lessonId ? { ...p, completed: true } : p);
      return [...prev, { lesson_id: lessonId, completed: true }];
    });
  };

  const isCompleted   = (lessonId: string) => progress.some((p) => p.lesson_id === lessonId && p.completed);
  const completedCount = progress.filter((p) => p.completed).length;
  const progressPct   = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  if (loading) return (
    <div className="p-6">
      <div className="h-8 bg-gray-800 rounded w-1/3 mb-4 animate-pulse" />
      <div className="h-4 bg-gray-800 rounded w-1/2 animate-pulse" />
    </div>
  );

  if (!course) return (
    <div className="p-6 text-center text-gray-400">
      <p>Course not found.</p>
      <Link href="/dashboard/courses" className="text-blue-400 mt-2 inline-block">Back to courses</Link>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Lesson sidebar */}
      <aside className="w-72 bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <Link href="/dashboard/courses" className="text-sm text-gray-400 hover:text-white mb-3 block">← Back</Link>
          <h2 className="text-sm font-bold text-white leading-tight">{course.title}</h2>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{completedCount}/{lessons.length} lessons</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {lessons.map((lesson, idx) => (
            <button key={lesson.id} onClick={() => setActiveLesson(lesson)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm ${activeLesson?.id === lesson.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isCompleted(lesson.id) ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {isCompleted(lesson.id) ? '✓' : idx + 1}
                </span>
                <span className="flex-1 leading-tight text-xs">{lesson.title}</span>
                <span className="text-xs opacity-60">{LESSON_TYPE_ICON[lesson.lesson_type ?? 'text']}</span>
              </div>
              {lesson.duration_minutes > 0 && <span className="text-xs text-gray-500 ml-7">{lesson.duration_minutes}min</span>}
            </button>
          ))}
        </div>
      </aside>

      {/* Lesson content */}
      <div className="flex-1 overflow-y-auto bg-gray-900 p-8">
        {activeLesson ? (
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg">{LESSON_TYPE_ICON[activeLesson.lesson_type ?? 'text']}</span>
              <h1 className="text-2xl font-bold text-white">{activeLesson.title}</h1>
              {activeLesson.is_free && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-semibold">FREE</span>}
            </div>
            {activeLesson.duration_minutes > 0 && (
              <p className="text-sm text-gray-400 mb-6">{activeLesson.duration_minutes} min</p>
            )}

            {/* ── YouTube inline player ── */}
            {activeLesson.lesson_type === 'youtube' && activeLesson.youtube_embed_id && (
              <div className="mb-6 rounded-xl overflow-hidden bg-black aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${activeLesson.youtube_embed_id}?rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeLesson.title}
                />
              </div>
            )}

            {/* ── PDF viewer ── */}
            {activeLesson.lesson_type === 'pdf' && activeLesson.pdf_url && (
              <div className="mb-6">
                <div className="rounded-xl overflow-hidden border border-gray-700" style={{ height: '600px' }}>
                  <iframe src={`${activeLesson.pdf_url}#view=FitH`} className="w-full h-full" title={activeLesson.title} />
                </div>
                <a href={activeLesson.pdf_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-blue-400 hover:text-blue-300">
                  📥 Download PDF
                </a>
              </div>
            )}

            {/* ── Audio player ── */}
            {activeLesson.lesson_type === 'audio' && activeLesson.audio_url && (
              <div className="mb-6 bg-gray-800 border border-gray-700 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-3">Audio Lesson</p>
                <audio controls className="w-full" src={activeLesson.audio_url}>
                  Your browser does not support audio.
                </audio>
              </div>
            )}

            {/* ── Quiz ── */}
            {activeLesson.lesson_type === 'quiz' && user && (
              <div className="mb-6">
                <QuizPlayer lesson={activeLesson} userId={user.id} onComplete={() => markComplete(activeLesson.id)} />
              </div>
            )}

            {/* ── Text content ── */}
            {activeLesson.content && (
              <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap mb-8 text-sm">
                {activeLesson.content}
              </div>
            )}

            {activeLesson.lesson_type !== 'quiz' && (
              <div className="flex items-center gap-4 pt-6 border-t border-gray-800">
                {!isCompleted(activeLesson.id) && (
                  <button onClick={() => markComplete(activeLesson.id)}
                    className="bg-green-600 hover:bg-green-700 px-6 py-2.5 rounded-lg font-semibold text-sm transition">
                    Mark as Complete ✓
                  </button>
                )}
                {isCompleted(activeLesson.id) && <span className="text-green-400 text-sm font-medium">✓ Completed</span>}
                {lessons.indexOf(activeLesson) < lessons.length - 1 && (
                  <button onClick={() => setActiveLesson(lessons[lessons.indexOf(activeLesson) + 1])}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-lg font-semibold text-sm transition">
                    Next Lesson →
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-20">
            <p>Select a lesson to start learning</p>
          </div>
        )}
      </div>
    </div>
  );
}
