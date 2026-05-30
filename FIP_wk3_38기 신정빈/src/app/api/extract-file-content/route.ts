import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { NextResponse } from "next/server";
import JSZip from "jszip";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import * as XLSX from "xlsx";

import { getOpenAIClient } from "@/lib/openai";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 20000;
const workerUrl = pathToFileURL(join(process.cwd(), "node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs")).href;

PDFParse.setWorker(workerUrl);

const textTypes = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json"
]);

const imageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "업로드된 파일을 찾을 수 없습니다." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "파일은 10MB 이하만 업로드할 수 있습니다." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = normalizeFileType(file);

    if (isPdf(file)) {
      const result = await extractPdf(buffer);
      return NextResponse.json({
        data: {
          fileName: file.name,
          fileType,
          contentKind: "pdf",
          text: limitText(result.text),
          pageCount: result.pageCount,
          truncated: result.text.length > MAX_TEXT_LENGTH
        }
      });
    }

    if (isDocx(file)) {
      const text = await extractDocx(buffer);
      return NextResponse.json({
        data: {
          fileName: file.name,
          fileType,
          contentKind: "word",
          text: limitText(text),
          truncated: text.length > MAX_TEXT_LENGTH
        }
      });
    }

    if (isPptx(file)) {
      const text = await extractPptx(buffer);
      return NextResponse.json({
        data: {
          fileName: file.name,
          fileType,
          contentKind: "powerpoint",
          text: limitText(text),
          truncated: text.length > MAX_TEXT_LENGTH
        }
      });
    }

    if (isSpreadsheet(file)) {
      const text = extractSpreadsheet(buffer);
      return NextResponse.json({
        data: {
          fileName: file.name,
          fileType,
          contentKind: "spreadsheet",
          text: limitText(text),
          truncated: text.length > MAX_TEXT_LENGTH
        }
      });
    }

    if (textTypes.has(fileType) || looksLikeTextFile(file.name)) {
      const text = buffer.toString("utf-8").trim();
      if (!text) {
        return NextResponse.json({ error: "파일에서 읽을 수 있는 텍스트를 찾지 못했습니다." }, { status: 422 });
      }

      return NextResponse.json({
        data: {
          fileName: file.name,
          fileType,
          contentKind: "text",
          text: limitText(text),
          truncated: text.length > MAX_TEXT_LENGTH
        }
      });
    }

    if (imageTypes.has(fileType)) {
      const text = await describeImage(file, buffer);
      return NextResponse.json({
        data: {
          fileName: file.name,
          fileType,
          contentKind: "image",
          text: limitText(text),
          truncated: text.length > MAX_TEXT_LENGTH,
          demoMode: !process.env.OPENAI_API_KEY
        }
      });
    }

    if (looksLikeLegacyOfficeFile(file.name)) {
      return NextResponse.json({
        error: "레거시 Office 파일은 아직 직접 읽을 수 없습니다. .doc은 .docx로, .ppt는 .pptx로 변환한 뒤 업로드해주세요."
      }, { status: 400 });
    }

    return NextResponse.json({
      error: "지원하지 않는 파일 형식입니다. PDF, DOCX, PPTX, XLSX, XLS, TXT, MD, JSON, CSV, PNG, JPG, WEBP, GIF 파일을 업로드해주세요."
    }, { status: 400 });
  } catch (error) {
    console.error("파일 내용 추출 실패", error);
    return NextResponse.json({ error: "파일 내용 추출 중 문제가 발생했습니다." }, { status: 400 });
  }
}

function normalizeFileType(file: File) {
  if (file.type) {
    return file.type;
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".md")) return "text/markdown";
  if (lowerName.endsWith(".txt")) return "text/plain";
  if (lowerName.endsWith(".json")) return "application/json";
  if (lowerName.endsWith(".csv")) return "text/csv";
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lowerName.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (lowerName.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (lowerName.endsWith(".xls")) return "application/vnd.ms-excel";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
  if (lowerName.endsWith(".webp")) return "image/webp";
  if (lowerName.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

function isPdf(file: File) {
  return normalizeFileType(file) === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isDocx(file: File) {
  return (
    normalizeFileType(file) === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

function isPptx(file: File) {
  return (
    normalizeFileType(file) === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    file.name.toLowerCase().endsWith(".pptx")
  );
}

function isSpreadsheet(file: File) {
  const fileType = normalizeFileType(file);
  const lowerName = file.name.toLowerCase();
  return (
    fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel" ||
    lowerName.endsWith(".xlsx") ||
    lowerName.endsWith(".xls")
  );
}

function looksLikeTextFile(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return [".txt", ".md", ".json", ".csv"].some((extension) => lowerName.endsWith(extension));
}

function looksLikeLegacyOfficeFile(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return lowerName.endsWith(".doc") || lowerName.endsWith(".ppt");
}

function limitText(text: string) {
  return text.slice(0, MAX_TEXT_LENGTH);
}

async function extractPdf(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText().finally(() => parser.destroy());
  const text = parsed.text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (!text) {
    throw new Error("PDF에서 읽을 수 있는 텍스트를 찾지 못했습니다.");
  }

  return {
    text,
    pageCount: parsed.total
  };
}

async function extractDocx(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const text = cleanText(result.value);

  if (!text) {
    throw new Error("Word 파일에서 읽을 수 있는 텍스트를 찾지 못했습니다.");
  }

  return text;
}

async function extractPptx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => getSlideNumber(a) - getSlideNumber(b));

  const slides = await Promise.all(
    slideFiles.map(async (fileName) => {
      const xml = await zip.files[fileName].async("text");
      const text = extractXmlText(xml);
      const slideNumber = getSlideNumber(fileName);
      return text ? `[슬라이드 ${slideNumber}]\n${text}` : "";
    })
  );

  const text = cleanText(slides.filter(Boolean).join("\n\n"));

  if (!text) {
    throw new Error("PowerPoint 파일에서 읽을 수 있는 텍스트를 찾지 못했습니다.");
  }

  return text;
}

function extractSpreadsheet(buffer: Buffer) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    dense: false
  });

  const sheets = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false }).trim();
    return csv ? `[시트: ${sheetName}]\n${csv}` : "";
  }).filter(Boolean);

  const text = cleanText(sheets.join("\n\n"));

  if (!text) {
    throw new Error("스프레드시트에서 읽을 수 있는 값을 찾지 못했습니다.");
  }

  return text;
}

function getSlideNumber(fileName: string) {
  const match = fileName.match(/slide(\d+)\.xml$/);
  return match ? Number(match[1]) : 0;
}

function extractXmlText(xml: string) {
  const matches = [...xml.matchAll(/<(?:a|m|p):t(?:\s[^>]*)?>([\s\S]*?)<\/(?:a|m|p):t>/g)];
  return cleanText(matches.map((match) => decodeXmlEntities(match[1])).join("\n"));
}

function cleanText(text: string) {
  return text.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function decodeXmlEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

async function describeImage(file: File, buffer: Buffer) {
  const openai = getOpenAIClient();

  if (!openai) {
    return [
      `업로드한 이미지 파일: ${file.name}`,
      "OpenAI API 키가 없어 이미지 내용을 직접 해석하지는 못했습니다.",
      "이미지에 담긴 IR 자료, 제품 화면, 팀 소개, 시장 자료의 핵심 내용을 아래 텍스트에 보완하면 더 정확한 분석을 받을 수 있습니다."
    ].join("\n");
  }

  const dataUrl = `data:${normalizeFileType(file)};base64,${buffer.toString("base64")}`;
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "당신은 초기 조직의 IR 자료, 제품 캡처, 소개 이미지에서 사업 분석에 필요한 정보를 추출하는 한국어 분석가입니다. 화면에 보이는 텍스트와 시각적 단서를 바탕으로 조직 설명 입력란에 넣기 좋은 한국어 요약을 작성하세요."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "이 이미지에서 학회 또는 학생 조직 분석에 필요한 내용을 추출해 주세요. 비전, 활동, 과거 프로젝트, 핵심 역량, 관심 산업, 기업 협업에 어필할 포인트가 보이면 항목별로 정리해 주세요. 추측은 최소화하고 보이는 정보 중심으로 작성해 주세요."
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl
            }
          }
        ]
      }
    ]
  });

  return completion.choices[0]?.message.content?.trim() || `이미지 파일 ${file.name}의 내용을 요약하지 못했습니다.`;
}
