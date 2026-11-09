import { canUseAi, readAiConfig } from '@/lib/aiSettings';
import { chatAi } from '@/lib/aiClient';
import { translate } from '@/lib/i18n';

function systemPrompt(item, language, context) {
  return [
    'You answer questions about a single saved link, using only the context below.',
    `Title: ${item.title}`,
    `URL: ${item.url}`,
    `Summary: ${item.summary || 'none'}`,
    `Category: ${item.category}`,
    `Tags: ${(item.tags || []).join(', ') || 'none'}`,
    context
      ? `Repository README excerpt (may be truncated):\n${context}`
      : 'No source content was available: rely on the fields above and say plainly when a detail is missing.',
    'If a question is about anything other than this link, decline in one short sentence.',
    'Never invent commands, files, versions or figures that are not in the context.',
    `Answer concisely in ${language === 'en' ? 'English' : 'French'}, in two or three sentences at most.`,
  ].join('\n');
}

/**
 * Answers a question about one link with the provider and key set in Settings.
 * Without a usable provider it resolves to a setup hint instead of throwing.
 * Provider and network failures reject, so the caller can report the cause.
 */
export async function askLinkQuestion(item, question, { language = 'fr', history = [], context = '' } = {}) {
  const config = readAiConfig();
  if (!canUseAi(config)) return translate(language, 'repoChatErrorNoAi');
  return chatAi(config, {
    system: systemPrompt(item, language, context),
    messages: [...history, { role: 'user', content: question }],
  });
}
