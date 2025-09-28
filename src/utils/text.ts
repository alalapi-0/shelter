const punctuationMap: Record<string, string> = {
  '，': ',',
  '。': '.',
  '！': '!',
  '？': '?',
  '；': ';',
  '：': ':',
  '（': '(',
  '）': ')',
  '“': '"',
  '”': '"'
};

export const normalizePunctuation = (input: string): string => {
  return input
    .split('')
    .map((char) => punctuationMap[char] ?? char)
    .join('')
    .replace(/[!?]{2,}/g, '!')
    .replace(/\.{2,}/g, '.');
};

export const normalizeWhitespace = (input: string): string => {
  return input.replace(/\s+/g, ' ').trim();
};

export const truncate = (input: string, maxLength: number): string => {
  if (input.length <= maxLength) {
    return input;
  }
  return `${input.slice(0, maxLength - 1)}…`;
};

export const stripDiacritics = (input: string): string => {
  return input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
};
