import Anthropic from "@anthropic-ai/sdk";

export type Lang = "kk" | "ru";
export type ChatTurn = { role: "user" | "assistant"; content: string };

type ChatProvider = "anthropic" | "deepseek" | null;

function chatProvider(): ChatProvider {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.DEEPSEEK_API_KEY) return "deepseek";
  return null;
}

// Vision (camera problem recognition) currently only works via Anthropic —
// DeepSeek's chat API does not accept image input.
function visionConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function isAiConfigured() {
  return chatProvider() !== null;
}

function systemPrompt(lang: Lang, subjectLabel: string) {
  const kk = `Сен — AI ҰСТАЗ платформасындағы жеке ЖИ мұғалімсің. Пән: ${subjectLabel}. 5-11 сынып оқушысымен қазақ тілінде сөйлесесің.
ЕРЕЖЕЛЕР:
- Ешқашан дайын жауапты бірден берме. Сократ әдісін қолдан: жетекші сұрақтар қой, оқушыны өзі ойлауға жетелеп.
- Жауапты бөлікке-бөлікке бөл, әр қадамнан кейін оқушының өзінің жалғастыруын сұра.
- Тек оқушы шынымен қиналып, көмек сұраса ғана толығырақ түсіндір, бірақ соңғы жауапты өзі айтуын күт.
- Қысқа, жылы, қолдаушы үнде сөйле. Балаға лайық қарапайым тілмен түсіндір.
- Қате жіберсе — сынама, қайта ойлануға бағыттайтын сұрақ қой.
- Тек кәдімгі мәтінмен жаз: markdown белгілерін (**, #, \`\`\`, тізім сызықшалары) қолданба, эмодзи қоспа.`;
  const ru = `Ты — AI ҰСТАЗ, персональный ИИ-наставник. Предмет: ${subjectLabel}. Общаешься с учеником 5-11 класса на русском языке.
ПРАВИЛА:
- Никогда не давай готовый ответ сразу. Используй метод Сократа: задавай наводящие вопросы, подводи ученика к мысли самому.
- Разбивай объяснение на шаги, после каждого шага спрашивай, что думает ученик дальше.
- Только если ученик действительно застрял и просит помощи — объясняй подробнее, но дай ему самому сформулировать финальный ответ.
- Говори коротко, тепло, поддерживающим тоном, простым языком, понятным ребёнку.
- Если ученик ошибся — не критикуй, задай вопрос, который направит его на переосмысление.
- Пиши только обычным текстом: не используй markdown-разметку (**, #, \`\`\`, дефисы-списки) и эмодзи.`;
  return lang === "ru" ? ru : kk;
}

const MOCK_OPENERS: Record<Lang, string[]> = {
  kk: [
    "Сәлем! Мен сенің AI ұстазыңмын. Не бойынша көмек керек — тақырыпты айтшы, бастайық.",
    "Қош келдің! Бүгін не үстінде жұмыс істейміз? Сұрағыңды немесе есепті жазшы.",
  ],
  ru: [
    "Привет! Я твой AI-наставник. С чем нужна помощь — расскажи тему, и начнём.",
    "Рад видеть! Над чем сегодня поработаем? Напиши свой вопрос или задачу.",
  ],
};

const MOCK_REPLIES: Record<Lang, string[]> = {
  kk: [
    "Түсінікті. Ал алдымен өзің ойлан: осы есепте бізге не белгілі, не белгісіз екенін анықтай аласың ба?",
    "Жақсы бағыт! Келесі қадамда не істеу керек деп ойлайсың — өз болжамыңды айтып көрші.",
    "Дұрыс жолдасың. Ал енді осы қадамды неге дәл солай жасау керек екенін өз сөзіңмен түсіндіріп көрші?",
    "Жақын қалдың! Тағы бір рет мұқият қара — бір жерде таңбаны (+ немесе −) тексеріп көрші, содан кейін не шығады?",
    "Керемет сұрақ. Ал соған ұқсас қарапайым мысал ойлап көрелік — сен қандай мысал келтірер едің?",
  ],
  ru: [
    "Понятно. Сначала подумай: сможешь определить, что в этой задаче известно, а что нужно найти?",
    "Хорошее направление! Как думаешь, что нужно сделать на следующем шаге — предположи сам.",
    "Ты на верном пути. А теперь попробуй своими словами объяснить, почему этот шаг нужен именно такой.",
    "Ты почти у цели! Проверь ещё раз внимательно знак (+ или −) в этом месте — что получится после этого?",
    "Отличный вопрос. Давай придумаем похожий простой пример — какой пример предложил бы ты?",
  ],
};

function pickMock(list: string[], seed: number) {
  return list[seed % list.length];
}

async function askClaude(lang: Lang, subjectLabel: string, history: ChatTurn[], message: string) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 500,
    system: systemPrompt(lang, subjectLabel),
    messages: [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user" as const, content: message },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text"
    ? textBlock.text
    : lang === "ru" ? "Извини, не смог сформулировать ответ." : "Кешір, жауап құрастыра алмадым.";
}

async function askDeepSeek(lang: Lang, subjectLabel: string, history: ChatTurn[], message: string) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt(lang, subjectLabel) },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: message },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`DeepSeek API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  return typeof reply === "string" && reply.trim()
    ? reply
    : lang === "ru" ? "Извини, не смог сформулировать ответ." : "Кешір, жауап құрастыра алмадым.";
}

export async function askAiTeacher(opts: {
  lang: Lang;
  subjectLabel: string;
  history: ChatTurn[];
  message: string;
}): Promise<{ reply: string; mocked: boolean }> {
  const { lang, subjectLabel, history, message } = opts;
  const provider = chatProvider();

  if (!provider) {
    const isFirst = history.length === 0;
    const seed = message.length + history.length;
    const reply = isFirst
      ? pickMock(MOCK_OPENERS[lang], seed)
      : pickMock(MOCK_REPLIES[lang], seed);
    return { reply, mocked: true };
  }

  const reply =
    provider === "anthropic"
      ? await askClaude(lang, subjectLabel, history, message)
      : await askDeepSeek(lang, subjectLabel, history, message);

  return { reply, mocked: false };
}

const MOCK_RECOGNIZED = "2x + 7 = 15";

export async function recognizeProblem(opts: {
  lang: Lang;
  imageBase64: string;
  mediaType: string;
}): Promise<{ recognized: string; mocked: boolean }> {
  if (!visionConfigured()) {
    return { recognized: MOCK_RECOGNIZED, mocked: true };
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt =
    opts.lang === "ru"
      ? "На изображении — рукописная или печатная математическая задача. Распознай и верни ТОЛЬКО саму задачу/уравнение текстом, без пояснений."
      : "Суретте қолжазба немесе баспа математикалық есеп бар. Тек есепті/теңдеуді мәтін түрінде тан, түсініктемесіз.";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: opts.mediaType as "image/jpeg" | "image/png" | "image/webp",
              data: opts.imageBase64,
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const recognized = textBlock && textBlock.type === "text" ? textBlock.text.trim() : MOCK_RECOGNIZED;
  return { recognized, mocked: false };
}
