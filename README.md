# Writing Prompt App: Screen Designs

Designs for a personal writing app that gives you a daily writing prompt, with streaks, a challenge mode and a word bank.

To try the screens, open `index.html` in a browser (or turn on GitHub Pages for this repo). Every screen is a plain HTML file in `screens/`, and the pictures below are in `images/`.

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

| Home | Write | Write, word bank open |
| --- | --- | --- |
| ![Home](images/home.png) | ![Write](images/write.png) | ![Word bank open](images/write-word-bank-open.png) |

| Challenge complete |
| --- |
| ![Challenge complete](images/challenge-complete.png) |

Coming next: the Challenge mode screen, where you see today's prompt and pick Easy, Medium or Hard.

## How the Write screen should work

- The screen opens straight to the writing space, so you can start typing right away.
- The prompt and word bank stay hidden so the screen feels calm and empty. Tap **See prompt** or **Word bank** to bring them back.
- The app marks a word bank word as used: it gets underlined in your writing and crossed out in the word bank.
- The word count is always visible.
- **Save for later** keeps your work so you can come back to it.
- You don't have to use every word bank word, but you need to use at least 3 before you can finish.
- When you finish, you see "Congrats, you've finished today's challenge!" with a button back to the home page.

## Still to decide

- Where the button to finish the entry goes on the Write screen.
- What happens if you try to finish with fewer than 3 word bank words.
- What the Write screen looks like in Easy mode, which has no word bank.
