export type ModerationResult =
  | { status: 'ok' }
  | { status: 'needs_review'; category: string; message: string }
  | { status: 'blocked'; category: string; message: string };

const hardViolations: { pattern: RegExp; category: string; message: string }[] = [
  { pattern: /(恐怖袭击|爆炸物)/i, category: 'violence', message: '内容涉及禁用暴力关键词' },
  { pattern: /(涉黄|黄色网站|裸照)/i, category: 'sexual', message: '内容包含禁止的成人主题' },
  { pattern: /(仇恨言论|灭绝)/i, category: 'hate', message: '内容包含仇恨言论' }
];

const softWarnings: { pattern: RegExp; category: string; message: string }[] = [
  { pattern: /(投资建议|金融理财)/i, category: 'finance', message: '涉及金融内容，请确认无欺诈风险后再发' },
  { pattern: /(政治|选举|敏感话题)/i, category: 'politics', message: '涉及公共事件，建议补充客观事实' }
];

export const moderation = {
  check(text: string): ModerationResult {
    for (const rule of hardViolations) {
      if (rule.pattern.test(text)) {
        return { status: 'blocked', category: rule.category, message: rule.message };
      }
    }

    for (const rule of softWarnings) {
      if (rule.pattern.test(text)) {
        return { status: 'needs_review', category: rule.category, message: rule.message };
      }
    }

    return { status: 'ok' };
  }
};
