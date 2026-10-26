// =====================================================================
// PROMPTS AND WORD BANKS
// These are starter examples. Replace them with your own!
// Keep every line in the same shape: "text in quotes", with a comma after.
// =====================================================================

// Prompts are grouped by the topics on the onboarding screen.
// The app only picks prompts from the topics the user chose.
// (If they chose none, it picks from every topic.)
// The topic names must match the onboarding buttons exactly.
const PROMPTS = {
  Fiction: {
    normal: [
      "Write about a hobby you could do for hours, but make the main character someone else.",
      "Describe a meal that reminds a character of someone they miss.",
      "Write about a hike, walk or trip where something unexpected happens."
    ],
    challenge: [
      "Tell a story from the point of view of an object in your room.",
      "Write a story that starts and ends with the same sentence."
    ]
  },
  Suspense: {
    normal: [
      "Write about a door in your town that only opens at midnight.",
      "Someone leaves a note on your desk. What does it say?",
      "Describe a sound in the house that nobody else can hear."
    ],
    challenge: [
      "Write a mystery where the last line reveals who did it.",
      "Write a scene that is only dialogue, with no descriptions."
    ]
  },
  Persuasive: {
    normal: [
      "Convince a friend to try your favorite hobby.",
      "Should students have homework on weekends? Pick a side.",
      "Make the case for your favorite season."
    ],
    challenge: [
      "Convince the reader that a boring food is the best food ever.",
      "Argue for something you actually disagree with."
    ]
  },
  Nonfiction: {
    normal: [
      "Write about a time you changed your mind about something.",
      "Describe a meal that reminds you of someone.",
      "Write about a hike, walk or trip you remember."
    ],
    challenge: [
      "Write a letter to someone 100 years in the future.",
      "Tell a true story about today in exactly 10 sentences."
    ]
  },
  Introspective: {
    normal: [
      "What are 3 small things that made you happy today?",
      "What would you tell yourself from one year ago?",
      "What is something you want to get better at, and why?"
    ],
    challenge: [
      "Describe your favorite place to be alone without naming it.",
      "Write about a sound that always makes you calm, without using the word calm."
    ]
  },
  Explanatory: {
    normal: [
      "Explain how to make your favorite snack to someone who has never cooked.",
      "What does a perfect Saturday look like for you, step by step?",
      "Explain the rules of a game you love."
    ],
    challenge: [
      "Explain how the internet works to your great-grandparent.",
      "Write a story where the weather changes everything, then explain why it happened."
    ]
  }
};

// Easy has 4 words, Medium 6, Hard 8 (picked at random from the list you choose).
const WORD_BANKS = {
  easy: [
    "bright", "calm", "gather", "notice", "whisper", "wander",
    "gentle", "sparkle", "quiet", "journey", "honest", "curious"
  ],
  medium: [
    "dialogue", "audit", "recant", "dispel", "relative", "posit",
    "linger", "vivid", "reluctant", "fragile", "ponder", "resolve"
  ],
  hard: [
    "ephemeral", "juxtapose", "ambivalent", "cacophony", "serendipity", "melancholy",
    "eloquent", "labyrinth", "ubiquitous", "petrichor", "resilient", "enigmatic"
  ]
};

// =====================================================================
// DEFINITIONS
// Shown when you tap a word in the word bank.
// If you add a new word and forget its definition, the app tries to
// look it up online instead.
// =====================================================================
const DEFINITIONS = {
  // Easy
  bright:      { type: "adjective", meaning: "Full of light. It can also mean smart or cheerful." },
  calm:        { type: "adjective", meaning: "Peaceful and relaxed, not upset or excited." },
  gather:      { type: "verb",      meaning: "To bring people or things together in one place." },
  notice:      { type: "verb",      meaning: "To see or become aware of something." },
  whisper:     { type: "verb",      meaning: "To speak very softly, using your breath instead of your full voice." },
  wander:      { type: "verb",      meaning: "To walk around slowly without a set plan or place to go." },
  gentle:      { type: "adjective", meaning: "Kind and soft, not rough or harsh." },
  sparkle:     { type: "verb",      meaning: "To shine with small, quick flashes of light." },
  quiet:       { type: "adjective", meaning: "Making little or no noise." },
  journey:     { type: "noun",      meaning: "A trip from one place to another, often a long one." },
  honest:      { type: "adjective", meaning: "Truthful; not lying, cheating or hiding things." },
  curious:     { type: "adjective", meaning: "Wanting to know or learn more about something." },
  // Medium
  dialogue:    { type: "noun",      meaning: "A conversation between two or more people, especially the spoken parts of a story or play." },
  audit:       { type: "noun / verb", meaning: "An official, careful check of records or accounts. To audit something is to check it carefully." },
  recant:      { type: "verb",      meaning: "To take back something you said or believed, often in public." },
  dispel:      { type: "verb",      meaning: "To make a feeling, worry or false belief go away." },
  relative:    { type: "noun / adjective", meaning: "A family member. As an adjective, it means compared to something else." },
  posit:       { type: "verb",      meaning: "To suggest an idea as true so it can be talked about or tested." },
  linger:      { type: "verb",      meaning: "To stay somewhere longer than you need to, often because you don't want to leave." },
  vivid:       { type: "adjective", meaning: "Very bright, clear or detailed, like a vivid color or a vivid memory." },
  reluctant:   { type: "adjective", meaning: "Not wanting to do something, so you do it slowly or unwillingly." },
  fragile:     { type: "adjective", meaning: "Easily broken, damaged or hurt." },
  ponder:      { type: "verb",      meaning: "To think about something carefully for a while." },
  resolve:     { type: "verb / noun", meaning: "To decide firmly, or to find a solution to a problem. As a noun, it means strong determination." },
  // Hard
  ephemeral:   { type: "adjective", meaning: "Lasting for a very short time." },
  juxtapose:   { type: "verb",      meaning: "To place two things side by side to show how different they are." },
  ambivalent:  { type: "adjective", meaning: "Having mixed feelings about something, both good and bad." },
  cacophony:   { type: "noun",      meaning: "A harsh, loud mix of sounds." },
  serendipity: { type: "noun",      meaning: "Finding something good by lucky chance." },
  melancholy:  { type: "noun / adjective", meaning: "A deep, quiet sadness that lasts for a while." },
  eloquent:    { type: "adjective", meaning: "Able to speak or write clearly, beautifully and convincingly." },
  labyrinth:   { type: "noun",      meaning: "A maze, or any confusing set of paths, passages or ideas." },
  ubiquitous:  { type: "adjective", meaning: "Found everywhere; very common." },
  petrichor:   { type: "noun",      meaning: "The earthy smell in the air when rain falls on dry ground." },
  resilient:   { type: "adjective", meaning: "Able to recover quickly from hard times or difficult situations." },
  enigmatic:   { type: "adjective", meaning: "Mysterious and hard to understand." }
};
