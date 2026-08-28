function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[−—]/g, "-");
}

export function isAnswerCorrect(submitted: string, correct: string) {
  const correctSet = new Set(correct.split(/[;,]/).map(normalize).filter(Boolean));
  const submittedSet = new Set(submitted.split(/[;,]/).map(normalize).filter(Boolean));
  if (correctSet.size !== submittedSet.size) return false;
  for (const v of correctSet) {
    if (!submittedSet.has(v)) return false;
  }
  return true;
}
