import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const { topic, level, type } = await req.json();
  // type: 'course_outline' | 'lesson_content' | 'quiz'

  let prompt = '';

  if (type === 'course_outline') {
    prompt = `You are an expert trading educator. Create a structured course outline for a ${level} level course on "${topic}".

Return ONLY valid JSON in this exact format:
{
  "title": "Course title",
  "description": "2-3 sentence description",
  "lessons": [
    { "title": "Lesson title", "duration_minutes": 15, "summary": "One sentence summary" }
  ]
}

Include 5-8 lessons appropriate for ${level} level. Keep it focused on practical trading education.`;

  } else if (type === 'lesson_content') {
    prompt = `You are an expert trading educator. Write comprehensive lesson content for: "${topic}"

This is for a ${level} level trading education platform. Write clear, educational content that a student can read and understand.
Format it in well-structured paragraphs. Include:
- Clear explanation of the concept
- Real-world examples relevant to crypto/forex trading
- Key takeaways
- Common mistakes to avoid

Write approximately 400-600 words. Return ONLY the lesson content text, no JSON.`;

  } else if (type === 'quiz') {
    prompt = `You are an expert trading educator. Create 4 multiple-choice quiz questions for the topic: "${topic}" at ${level} level.

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}

Make questions practical and test real understanding, not just memorization.`;
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    if (type === 'lesson_content') {
      return NextResponse.json({ content: text });
    }

    // Parse JSON response for outline and quiz
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);

  } catch (err) {
    console.error('AI generation error:', err);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }
}
