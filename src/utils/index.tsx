// src/utils/index.ts

export function kmToMiles(km: number): number {
  return km * 0.621371;
}

// Safer escapeHTML that handles null/undefined and converts input to string
export const escapeHTMLSafe = (str: string | number | null | undefined): string => {
  if (str === null || str === undefined) return '';
  const text = String(str); // Convert to string
  const map: { [key: string]: string } = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (match) => map[match]);
};

// You can add slugify and other utils here later
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}