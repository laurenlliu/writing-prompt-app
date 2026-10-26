# Writing Prompt App: Screen Designs

Designs for a personal writing app that gives you a daily writing prompt, with streaks, a challenge mode and a word bank.

To try the screens, open `index.html` in a browser (or turn on GitHub Pages for this repo). Every screen is a plain HTML file in `screens/`, and the pictures below are in `images/`.

## The working app

Try it here: **https://laurenlliu.github.io/writing-prompt-app/app/** (open it on a phone).

What works so far (only the screens she has drawn):

- **Onboarding** the first time you open it. You can change the answers later from your profile.
- **Home** shows your real streak and recent entries.
- **Make a choice → Prompt (3 re-spins a day) → Write → Congrats.**
- The **Write** screen counts your words and underlines word bank words as you use them. In the word bank, used words are crossed out, and tapping a word shows what it means. Hard mode has a 10 minute timer.
- **Done writing** checks that you used at least 3 word bank words (and the word minimum on Medium and Hard), then saves your entry.
- **Save for later** keeps your story, and Complete daily challenge takes you back to it.
- **Profile:** change your picture, change your onboarding answers, streaks, entries written, status, levels done and words typed.
- **See past entries** with Organize by date, mode or word count, and **Writing stats**.
- **Prompts match your onboarding answers.** Prompts in `data.js` are grouped by topic, and the app only picks from the topics you chose.
- **AI prompts (optional):** once the free Cloudflare Worker is set up (see `SETUP-AI.md`), each prompt is written fresh by AI from your topics and goal. If the AI is off or busy, the `data.js` prompts are used.
- **Add to Home Screen** (Safari share button, or Chrome menu) and it opens full screen like a real app, even offline. The icon is a placeholder until the logo is drawn.
- Everything is saved on the phone you use, so nothing needs an account yet. Cloud saving is ready to switch on once the sign-in screen is designed: see `SETUP-CLOUD.md`.

Buttons that don't do anything yet because they haven't been designed: Explore prompts, Memories, Favorite entries, the Prompt button on the Write screen, tapping an old entry, and this week's ratings.

Files in `app/`:

- `index.html`: all the screens.
- `styles.css`: colors, fonts and button styles (change a color once at the top and every screen updates).
- `data.js`: **the prompts, word bank lists and word definitions. Replace these with your own!** If a word has no definition, the app looks it up online.
- `worker/worker.js` (next to the `app` folder): the AI prompt writer that runs on Cloudflare.
- `cloud.js`: cloud saving, switched off until Firebase is set up.
- `manifest.webmanifest`, `sw.js` and `icons/`: what makes the app installable and work offline.
- `app.js`: how everything works. The rules (words per level, word minimums, timer length, re-spins per day) are at the top.

## Colors and fonts

| Use | Color |
| --- | --- |
| Yellow | `#eedda3` |
| Orange (peach) | `#ecc2b0` |
| Pink | `#eea9bc` |
| Background (cream) | `#FBF7EE` |
| Text (warm brown) | `#3A2E2A` |
| Light text | `#7A6A62` |

Headings use **Fraunces** and everything else uses **DM Sans** (both free on Google Fonts).

## Onboarding

Option boxes start with just a colored outline. When you tap one, it fills in with its color and the checkbox gets a check mark.

| 1. Main goal | 2. Topics | 3. Writing help |
| --- | --- | --- |
| ![Onboarding 1](images/onboarding-1-goal.png) | ![Onboarding 2](images/onboarding-2-topics.png) | ![Onboarding 3](images/onboarding-3-writing-help.png) |

## Main app

The flow: Home → Make a choice → Prompt → Write → Challenge complete.

| Home | Make a choice | Prompt |
| --- | --- | --- |
| ![Home](images/home.png) | ![Make a choice](images/make-a-choice.png) | ![Prompt](images/prompt.png) |

| Write | Write, word bank open | Challenge complete |
| --- | --- | --- |
| ![Write](images/write.png) | ![Word bank open](images/write-word-bank-open.png) | ![Challenge complete](images/challenge-complete.png) |

## Profile

From the home screen, tap **Update profile** to open your profile. From there you can see your past entries and your writing stats.

| Profile | See past entries | Organize by, open | Writing stats |
| --- | --- | --- | --- |
| ![Profile](images/profile.png) | ![See past entries](images/past-entries.png) | ![Organize by open](images/past-entries-organize.png) | ![Writing stats](images/writing-stats.png) |

- **Profile:** change your picture (pick a drawn icon or upload a photo), change your onboarding answers, and see your current vs. longest streak, entries written, current status (novice, wordsmith or storyteller), levels done, words typed and favorite entries.
- **See past entries:** your entries as little pages with the date underneath. Organize them by date, mode or word count.
- **Writing stats:** most used mode, this week's ratings, minutes spent writing and longest streak.

## How challenge mode should work

- You pick a difficulty, a prompt type (normal or challenge mode) and a word bank every day. The app doesn't remember your last choice.
- **Easy:** 4 word bank words.
- **Medium:** 6 word bank words and a word count minimum.
- **Hard:** 8 word bank words, a word count minimum and a timer.
- Harder levels get more words, not harder words.
- You see your word bank words before you start writing.
- If you don't like the prompt, you can re-spin it 3 or 4 times.
- You can go back to the home screen without starting.

## How the Write screen should work

- The screen opens straight to the writing space, so you can start typing right away.
- The prompt and word bank stay hidden so the screen feels calm and empty. Tap **See prompt** or **Word bank** to bring them back.
- The app marks a word bank word as used: it gets underlined in your writing and crossed out in the word bank.
- The word count is always visible.
- **Save for later** keeps your work so you can come back to it.
- You don't have to use every word bank word, but you need to use at least 3 before you can finish.
- When you finish, you see "Congrats, you've finished today's challenge!" with a button back to the home page.

## Still to decide

- What happens if you tap Done writing with fewer than 3 word bank words used.
- The exact number of prompt re-spins (3 or 4) and how many are left.
- How status badges are earned (number of entries, streaks, or points).
- What the screen for reading one old entry looks like.
- Coming next: the app logo and drawn profile icons.
