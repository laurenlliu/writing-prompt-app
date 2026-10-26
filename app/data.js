// =====================================================================
// PROMPTS AND WORD BANKS
// These are starter examples. Replace them with your own!
// Keep every line in the same shape: "text in quotes", with a comma after.
// =====================================================================

const PROMPTS = {
  normal: [
    "What are 3 small things that made you happy today?",
    "Describe your favorite place to be alone.",
    "Write about a time you changed your mind about something.",
    "What would you tell yourself from one year ago?",
    "Describe a meal that reminds you of someone.",
    "Write about a hobby you could do for hours.",
    "What is something you want to get better at, and why?",
    "Describe the view from a window you know well.",
    "Write about a hike, walk or trip you remember.",
    "What does a perfect Saturday look like for you?",
    "Write about a piece of art that made you feel something.",
    "Describe a sound that always makes you calm."
  ],
  challenge: [
    "Write a story that starts and ends with the same sentence.",
    "Write about a door in your town that only opens at midnight.",
    "Tell a story from the point of view of an object in your room.",
    "Write a scene that is only dialogue, with no descriptions.",
    "Write a mystery where the last line reveals who did it.",
    "Convince the reader that a boring food is the best food ever.",
    "Write a letter to someone 100 years in the future.",
    "Write a story where the weather changes everything."
  ]
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
