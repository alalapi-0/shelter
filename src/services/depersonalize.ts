import { normalizePunctuation, normalizeWhitespace, stripDiacritics, truncate } from '../utils/text.js';

type DepersonalizeOptions = {
  maxLength?: number;
};

const fillerReplacements: Record<string, string> = {
  '哈哈哈': '哈哈',
  '233': '哈哈',
  'orz': '加油',
  '😊': '[smile]',
  '😂': '[smile]'
};

const softSynonyms: Record<string, string> = {
  老铁: '朋友',
  宝贝: '朋友',
  兄弟: '朋友'
};

const sensitivePatterns: { regex: RegExp; label: string }[] = [
  { regex: /\b\d{11}\b/g, label: '[phone]' },
  { regex: /\b\d{3}[- ]?\d{3,4}[- ]?\d{4}\b/g, label: '[phone]' },
  { regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, label: '[email]' },
  { regex: /@\w+/g, label: '[@handle]' },
  { regex: /(https?:\/\/|www\.)[\w-]+(\.[\w-]+)+\S*/gi, label: '[link]' },
  { regex: /exif\s*[:=].*/gi, label: '[metadata]' }
];

export const depersonalize = (text: string, options: DepersonalizeOptions = {}): string => {
  let output = stripDiacritics(text);

  for (const [source, target] of Object.entries(fillerReplacements)) {
    output = output.replace(new RegExp(source, 'gi'), target);
  }

  for (const [source, target] of Object.entries(softSynonyms)) {
    output = output.replace(new RegExp(source, 'gi'), target);
  }

  for (const { regex, label } of sensitivePatterns) {
    output = output.replace(regex, label);
  }

  output = normalizePunctuation(output);
  output = normalizeWhitespace(output);

  const maxLength = options.maxLength ?? 2000;
  output = truncate(output, maxLength);

  return output;
};
