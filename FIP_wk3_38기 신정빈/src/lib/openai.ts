import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  return client;
}

export function safeJsonParse<T>(content: string | null | undefined, fallback: T): T {
  if (!content) {
    return fallback;
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export async function generateJson<T>({
  system,
  user,
  fallback,
  temperature = 0.3
}: {
  system: string;
  user: unknown;
  fallback: T;
  temperature?: number;
}): Promise<T> {
  const openai = getOpenAIClient();

  if (!openai) {
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${system}\n\n반드시 유효한 JSON 객체만 반환하세요. 모든 사용자-facing 텍스트는 한국어로 작성하세요. LinkedIn은 입력 데이터에 있는 URL만 언급하고, 직접 수집하거나 추정하지 마세요.`
        },
        {
          role: "user",
          content: JSON.stringify(user)
        }
      ]
    });

    return safeJsonParse<T>(completion.choices[0]?.message.content, fallback);
  } catch {
    return fallback;
  }
}
