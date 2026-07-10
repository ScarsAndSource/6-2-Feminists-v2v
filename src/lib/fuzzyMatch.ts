import type { Entry } from './types';

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

export interface TagSuggestion {
  representativeNote: string;
  count: number;
}

const MIN_CLUSTER_SIZE = 3;
const MAX_DISTANCE = 2;

export function findTagPromotionSuggestion(
  entries: Entry[],
  alreadyPromotedNotes: string[]
): TagSuggestion | null {
  const notes = entries
    .flatMap(e => e.tags)
    .filter(t => t.tag === 'other' && t.note && t.note.trim().length > 0)
    .map(t => t.note!.trim().toLowerCase());

  const promotedSet = new Set(alreadyPromotedNotes.map(n => n.trim().toLowerCase()));
  const remaining = notes.filter(n => !promotedSet.has(n));
  if (remaining.length < MIN_CLUSTER_SIZE) return null;

  const clusters: { representative: string; members: string[] }[] = [];

  for (const note of remaining) {
    let placed = false;
    for (const cluster of clusters) {
      if (levenshtein(note, cluster.representative) <= MAX_DISTANCE) {
        cluster.members.push(note);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push({ representative: note, members: [note] });
  }

  const best = clusters
    .filter(c => c.members.length >= MIN_CLUSTER_SIZE)
    .sort((a, b) => b.members.length - a.members.length)[0];

  if (!best) return null;

  return { representativeNote: best.representative, count: best.members.length };
}
