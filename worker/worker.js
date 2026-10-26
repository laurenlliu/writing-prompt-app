// =====================================================================
// AI PROMPT WRITER (Cloudflare Worker)
// The app asks this for a new writing prompt. It uses Cloudflare's free
// Workers AI, so there is no API key to hide.
// Setup steps are in SETUP-AI.md in the repo.
// =====================================================================

const MODEL = '@cf/meta/llama-3.1-8b-instruct';

// Only the real app (and testing on your own computer) can use this
const ALLOWED_ORIGINS = ['https://laurenlliu.github.io', 'http://localhost:8000', 'http://127.0.0.1:8000'];

const TOPICS = ['Persuasive', 'Fiction', 'Nonfiction', 'Suspense', 'Introspective', 'Explanatory'];
const TOPIC_HINTS = {
  Persuasive: 'convincing someone of an opinion',
  Fiction: 'a made-up story',
  Nonfiction: 'a true story from real life',
  Suspense: 'a mysterious or tense story',
  Introspective: 'thinking about your own feelings and experiences',
  Explanatory: 'explaining how something works or how to do something'
};
const LEVELS = {
  easy: 'simple and quick to start, for a younger or newer writer',
  medium: 'a bit more thought, with room for detail',
  hard: 'thoughtful and detailed, for a confident writer'
};

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}
function reply(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
}

// Keep the user's goal short and plain so it can't take over the instructions
function cleanGoal(goal) {
  return String(goal || '').replace(/[^\w\s.,'!?-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

// Tidy what the AI sends back: one sentence, no quotes or labels
function cleanPrompt(text) {
  let t = String(text || '').split('\n').map((s) => s.trim()).filter(Boolean)[0] || '';
  t = t.replace(/^(prompt|writing prompt)\s*[:\-]\s*/i, '').replace(/^["'“”]+|["'“”]+$/g, '').trim();
  return t;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
    if (request.method !== 'POST') return reply({ error: 'Use POST' }, 405, origin);
    if (!ALLOWED_ORIGINS.includes(origin)) return reply({ error: 'Not allowed' }, 403, origin);

    let input;
    try { input = await request.json(); } catch (e) { return reply({ error: 'Bad request' }, 400, origin); }

    const type = input.type === 'challenge' ? 'challenge' : 'normal';
    const level = LEVELS[input.level] ? input.level : 'easy';
    let topics = (Array.isArray(input.topics) ? input.topics : []).filter((t) => TOPICS.includes(t));
    if (!topics.length) topics = TOPICS;
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const goal = cleanGoal(input.goal);
    const avoid = String(input.avoid || '').slice(0, 200);

    const system = [
      'You write one writing prompt for a journaling app used by kids and teens.',
      'Rules: exactly one sentence, under 30 words, friendly and age-appropriate,',
      'no violence, scary gore, romance, or mature topics, and nothing that asks for personal details like names, addresses, or schools.',
      'Reply with only the prompt itself. No quotes, no title, no explanation.'
    ].join(' ');

    const user = [
      `Topic: ${topic} (${TOPIC_HINTS[topic]}).`,
      `Difficulty: ${level}, ${LEVELS[level]}.`,
      type === 'challenge'
        ? 'Make it a challenge prompt with a fun twist or rule, like writing from an object\'s point of view or using only dialogue.'
        : 'Make it a normal, everyday prompt that is easy to start.',
      goal ? `The writer's goal is: "${goal}". Let it inspire the prompt if it fits.` : '',
      avoid ? `Do not repeat this prompt: "${avoid}".` : ''
    ].filter(Boolean).join(' ');

    try {
      const result = await env.AI.run(MODEL, {
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        max_tokens: 80,
        temperature: 0.9
      });
      const prompt = cleanPrompt(result && result.response);
      if (prompt.length < 10 || prompt.length > 300) return reply({ error: 'Bad answer from AI' }, 502, origin);
      return reply({ prompt, topic }, 200, origin);
    } catch (e) {
      return reply({ error: 'AI is busy, try again' }, 503, origin);
    }
  }
};
