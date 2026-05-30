const Anthropic = require("@anthropic-ai/sdk");

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
      body: JSON.stringify({ error: "잘못된 요청입니다." }),
    };
  }

  const { docData, docName, question, images, imageData } = body;
  if (!question) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "질문이 없습니다." }),
    };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const system = `당신은 서류 이미지를 보고 질문에 정확하게 답하는 어시스턴트입니다.
규칙:
- 모든 페이지를 꼼꼼히 읽고, 실제 적힌 내용만 근거로 답하세요. 절대 추측하지 마세요.
- 첫 줄은 반드시 아래 중 하나로 시작하세요:
  ✅ 됩니다 — 서류에 가능하다고 명시된 경우
  ❌ 안 됩니다 — 서류에 불가하다고 명시된 경우
  ⚠️ 조건부 가능 — 조건이 있는 경우
  📋 서류에 해당 내용 없음 — 관련 내용이 없는 경우
  🔧 해결 방법 있음 — 절차/방법이 있는 경우
- 두 번째 줄: 서류에서 찾은 실제 내용을 그대로 인용하거나 요약해 1~2문장으로 쓰세요.
- 만약 서류에 해결 절차가 적혀 있다면 반드시 그 내용을 알려주세요.
- 전체 3줄 이내.`;

  try {
    let userContent;
    const allImages = images || (imageData ? [imageData] : null);

    if (allImages && allImages.length > 0) {
      // 모든 페이지 이미지를 전달
      userContent = allImages.map((img, i) => ([
        allImages.length > 1
          ? { type: "text", text: `[${i + 1}/${allImages.length} 페이지]` }
          : null,
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: img } },
      ])).flat().filter(Boolean);
      userContent.push({
        type: "text",
        text: `위 서류의 모든 페이지를 보고 다음 질문에 답하세요.\n\n질문: ${question}`,
      });
    } else {
      const ctx = [
        `서류명: ${docName || ""}`,
        `유형: ${(docData || {}).docType || ""}`,
        `요약: ${(docData || {}).summary || ""}`,
        `핵심항목: ${((docData || {}).keyPoints || []).map((k) => `${k.title}: ${k.content}`).join(" / ")}`,
        `주의사항: ${((docData || {}).redFlags || []).join(" / ")}`,
      ].join("\n");
      userContent = `[서류 정보]\n${ctx}\n\n질문: ${question}`;
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      system,
      messages: [{ role: "user", content: userContent }],
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ answer: message.content[0].text.trim() }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "답변 생성 중 오류: " + err.message }),
    };
  }
};
