import { TAG_LABELS } from './types';

const CUSTOM_PREFIX = 'custom_';

export function slugifyCustomTag(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${CUSTOM_PREFIX}${slug || 'tag'}`;
}

export function isCustomTag(tag: string): boolean {
  return tag.startsWith(CUSTOM_PREFIX);
}

export function getTagLabel(tag: string): string {
  if (TAG_LABELS[tag]) return TAG_LABELS[tag];
  const stripped = isCustomTag(tag) ? tag.slice(CUSTOM_PREFIX.length) : tag;
  const words = stripped.split('_').filter(Boolean);
  if (words.length === 0) return 'Custom';
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
