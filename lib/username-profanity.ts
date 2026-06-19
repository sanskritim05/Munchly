export const PROFANITY_USERNAME_MESSAGE = "This username isn't allowed";

const PROFANITY_TERMS = [
  "anal",
  "asshole",
  "bastard",
  "bitch",
  "blowjob",
  "bollocks",
  "boner",
  "boob",
  "boobs",
  "bullshit",
  "clit",
  "cock",
  "cocks",
  "cum",
  "cunt",
  "dick",
  "dildo",
  "dyke",
  "fag",
  "faggot",
  "fuck",
  "fucker",
  "fucking",
  "handjob",
  "hitler",
  "homo",
  "hooker",
  "horny",
  "jerkoff",
  "jizz",
  "kike",
  "milf",
  "motherfucker",
  "negro",
  "nigga",
  "nigger",
  "penis",
  "piss",
  "porn",
  "porno",
  "pussy",
  "rape",
  "rapist",
  "retard",
  "retarded",
  "schlong",
  "sex",
  "shit",
  "shitty",
  "slut",
  "spic",
  "tit",
  "tits",
  "twat",
  "vagina",
  "vibrator",
  "wank",
  "wanker",
  "whore",
  "wtf",
];

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@/, "");
}

function leetDecode(value: string) {
  return value
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");
}

function compactUsername(value: string) {
  return leetDecode(normalizeUsername(value).replace(/_/g, ""));
}

function termMatches(candidate: string, term: string) {
  if (!candidate || !term) return false;
  if (candidate === term) return true;

  if (term.length <= 3) {
    return false;
  }

  let index = candidate.indexOf(term);
  while (index !== -1) {
    const before = index > 0 ? candidate[index - 1] : "";
    const after = candidate[index + term.length] ?? "";
    const startsClean = index === 0 || before === "_";
    const endsClean = !after || after === "_" || /\d/.test(after);

    if (startsClean && endsClean) {
      return true;
    }

    index = candidate.indexOf(term, index + 1);
  }

  return false;
}

export function containsUsernameProfanity(value: string) {
  const normalized = normalizeUsername(value);
  const compact = compactUsername(value);
  const segments = normalized.split("_").filter(Boolean);
  const candidates = Array.from(new Set([compact, ...segments]));

  for (const term of PROFANITY_TERMS) {
    for (const candidate of candidates) {
      if (termMatches(candidate, term)) {
        return true;
      }
    }
  }

  return false;
}
