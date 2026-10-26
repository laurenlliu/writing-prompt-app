# Turning on AI prompts (Cloudflare Workers AI, free)

The app can ask a small AI model for a new prompt that matches the user's onboarding answers (their topics and goal). It runs on Cloudflare's free plan, so there's no API key and no credit card. About 10 minutes.

If this is never set up, or the AI is busy, the app uses the prompts in `app/data.js` instead.

## What gets sent to the AI

Only the prompt type (normal or challenge), the level, the topics the user picked and their goal (cut to 120 characters). **Never their writing.**

## Steps

1. Go to https://dash.cloudflare.com and sign up for a free account.
2. In the left menu, open **Compute (Workers) > Workers & Pages**, then click **Create** (or **Create application**).
3. Choose **Start with Hello World**, name it `writing-prompts`, and click **Deploy**.
4. Click **Edit code**. Delete everything in the editor, paste in all of `worker/worker.js` from this repo, and click **Deploy**.
5. Go back to the Worker's page, open **Settings > Bindings**, click **Add binding**, choose **Workers AI**, name it exactly `AI`, and save. (Deploy again if it asks.)
6. Copy the Worker's address from its page. It looks like `https://writing-prompts.<your-name>.workers.dev`.
7. Paste that address into `AI_PROMPT_URL` near the top of `app/app.js`:
   ```js
   const AI_PROMPT_URL = 'https://writing-prompts.your-name.workers.dev';
   ```

## Rules you can change

- `AI_PROMPTS_PER_DAY` in `app/app.js`: how many AI prompts each user gets a day before the app switches to `data.js` (starts at 15).
- The instructions the AI follows (one sentence, kid-friendly, no mature topics) are in the `system` text in `worker/worker.js`.
- `MODEL` in `worker/worker.js` picks the AI model. The default, Llama 3.1 8B, is small and plenty for one-sentence prompts.
- `ALLOWED_ORIGINS` in `worker/worker.js` lists the websites allowed to use the Worker. Add yours if the app moves.
