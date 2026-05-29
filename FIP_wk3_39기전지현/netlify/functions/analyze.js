const Anthropic = require("@anthropic-ai/sdk");

const DOC_PROMPTS = {
  product: "제품설명서",
  terms: "이용약관",
  insurance: "보험서류",
  contract: "계약서",
  other: "일반 서류",
};

const SYSTEM_PROMPT = `당신은 일상 서류를 분석해 핵심만 추려주는 AI입니다. 원문을 그대로 옮기지 말고, 사용자가 꼭 알아야 할 내용만 짧고 명확하게 재작성하세요.

절대 금지:
- 원문 문장을 그대로 복사하지 마세요
- 길게 나열하지 마세요. 각 항목은 1~2줄 이내
- JSON 외 어떤 텍스트도 출력 금지 (마크다운, 코드블록, 설명 전부 금지)
- 문자열 내 큰따옴표는 반드시 \\"로 이스케이프
- 줄바꿈은 \\n으로만

출력 JSON 형식 (이 구조 그대로):
{"docType":"제품명 + 서류유형 (예: 전자레인지 사용설명서)","summary":"이 서류가 무엇인지 + 핵심 2문장. 원문 복사 금지.","actions":[{"when":"시점","what":"구체적 행동 (원문 복사 금지, 직접 재작성)"}],"tables":[{"title":"표 제목","headers":["항목","내용","가능여부"],"rows":[["항목명","한줄설명","ok또는no또는maybe"]]}],"steps":[{"title":"절차명","items":["1단계","2단계"]}],"keyPoints":[{"title":"제목","content":"1줄 설명","level":"info"}],"checklist":[{"item":"확인항목","checked":false}],"redFlags":["위험/주의 조항 1줄"],"recommendation":"총평 1문장"}

개수 제한 (반드시 준수):
- actions: 최대 3개, 가장 중요한 것만
- tables: 표 형태 정보 있을 때만, 없으면 []
- steps: 순서 있는 절차 있을 때만, 없으면 []
- keyPoints: 최대 4개
- checklist: 최대 4개
- redFlags: 최대 3개

tables rows 규칙: 마지막 컬럼은 반드시 ok / no / maybe 중 하나만. 텍스트 설명은 중간 컬럼에.
actions what 규칙: "전원선을 물 근처에 두지 마세요" 처럼 직접 행동 문장으로. "안전주의사항을 읽으세요" 같은 문서 참조 금지.
level: info(일반) / warning(주의) / danger(위험)`;


exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "API 키가 설정되지 않았습니다." }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "잘못된 요청 형식입니다." }),
    };
  }

  const { pages, fileData, mediaType, docType } = body;

  // Support both legacy single-file and new multi-page format
  const pageList = pages || (fileData ? [{ fileData, mediaType }] : null);

  if (!pageList || pageList.length === 0) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "파일 데이터가 없습니다." }),
    };
  }

  const docLabel = DOC_PROMPTS[docType] || DOC_PROMPTS.other;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    // Build content blocks for all pages
    const contentBlocks = [];

    pageList.forEach((page, i) => {
      if (pageList.length > 1) {
        contentBlocks.push({ type: "text", text: `[${i + 1}/${pageList.length} 페이지]` });
      }
      if (page.mediaType === "application/pdf") {
        contentBlocks.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: page.fileData },
        });
      } else {
        contentBlocks.push({
          type: "image",
          source: { type: "base64", media_type: page.mediaType, data: page.fileData },
        });
      }
    });

    contentBlocks.push({
      type: "text",
      text: pageList.length > 1
        ? `위 ${pageList.length}장의 이미지는 한 세트의 "${docLabel}"입니다. 모든 페이지를 종합하여 분석하고 지정된 JSON 형식으로 응답해주세요.`
        : `위 문서는 "${docLabel}"입니다. 내용을 분석하여 지정된 JSON 형식으로 응답해주세요.`,
    });

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const rawText = message.content[0].text.trim();

    // 마크다운 코드블록 제거 (```json ... ``` 형태 처리)
    const stripped = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // JSON 파싱 시도
    let result;
    try {
      result = JSON.parse(stripped);
    } catch {
      // 중괄호 범위로 다시 추출
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI 응답에서 JSON을 찾을 수 없습니다.");
      result = JSON.parse(jsonMatch[0]);
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "분석 중 오류가 발생했습니다: " + err.message,
      }),
    };
  }
};
