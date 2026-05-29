"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clipboard, Download, Loader2, Send, Upload } from "lucide-react";
import JSZip from "jszip";

import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState, ErrorBox, PageHeader, PrimaryButton } from "@/components/ui";
import { collaborationTypeLabels, proposalLengthLabels, proposalToneLabels } from "@/lib/labels";
import { companyPool, findCompanyById } from "@/lib/mockData";
import { readSocietyState } from "@/lib/storage";
import type { CollaborationType, CompanyScore, EnvironmentAnalysis, ProjectProposalOutput, ProposalLength, ProposalTone, SocietyAnalysis, SocietyProfileInput } from "@/lib/types";

const BIT_TEMPLATE_GUIDE = `BIT 산학협력 제안서 형식
1. 표지: 기업명 x BIT 산학협력 프로젝트 제안서, CONTACT, 기업 로고
2. 산학협력 제안 개요: 주제 제안 1·2, 최종 아웃풋, 프로젝트 계획, 프로젝트 기간, 참여 인원, 팀 구성
3. 역대 산학협력 프로젝트 주제: 제품/서비스 고객 개발, 시장 분석 및 신사업 아이디어, 콘텐츠 개발 및 서비스 개선, 마케팅 및 프로모션, 신기술 기반 수익 모델, 서비스 개선 및 활성화
4. 산학협력 주제 제안 1: 주제명과 본문
5. 산학협력 주제 제안 2: 주제명과 본문
6. 추가 가능 주제: 기업이 원하는 주제, 내부 자원 부족으로 진행하지 못한 프로젝트, 기타 고민 사항, 2030 소비자 raw data 강점
7. BIT 요청사항 및 최종 아웃풋: Kick-off, 주 1회 서면 피드백, 중간 보고, 최종 발표, 프로젝트 운영지원금, 전략 보고서, 설문/인터뷰 raw data
8. 프로젝트 진행 계획: 사전 미팅, Kick-Off, 1차 피드백, 중간발표 및 2차 피드백, 최종발표
9. 마무리: CONTACT 및 감사 인사`;

export default function ProposalPage() {
  return (
    <Suspense fallback={<DashboardShell><EmptyState title="불러오는 중입니다" description="프로젝트 제안 생성 화면을 준비하고 있습니다." /></DashboardShell>}>
      <ProposalContent />
    </Suspense>
  );
}

function ProposalContent() {
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get("company") || companyPool[0]?.id || "";
  const [society, setSociety] = useState<SocietyProfileInput | null>(null);
  const [analysis, setAnalysis] = useState<SocietyAnalysis | null>(null);
  const [environmentAnalysis, setEnvironmentAnalysis] = useState<EnvironmentAnalysis | null>(null);
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [preferredCollaborationType, setPreferredCollaborationType] = useState<CollaborationType>("industry_academic_collaboration");
  const [desiredProjectDuration, setDesiredProjectDuration] = useState("2~4주");
  const [capabilitiesToEmphasize, setCapabilitiesToEmphasize] = useState("시장 조사, 설문, IDI, 경쟁사 분석, 전략 제안서");
  const [useCustomTemplate, setUseCustomTemplate] = useState(false);
  const [proposalTemplateName, setProposalTemplateName] = useState("기본 정형 제안서");
  const [proposalTemplateText, setProposalTemplateText] = useState("");
  const [proposalTemplateFile, setProposalTemplateFile] = useState<File | null>(null);
  const [tone, setTone] = useState<ProposalTone>("strategic");
  const [outputLength, setOutputLength] = useState<ProposalLength>("one_page_proposal");
  const [scoreContext, setScoreContext] = useState<CompanyScore | null>(null);
  const [output, setOutput] = useState<ProjectProposalOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [error, setError] = useState("");
  const [templateError, setTemplateError] = useState("");

  const selectedCompany = useMemo(() => findCompanyById(companyId) || null, [companyId]);

  useEffect(() => {
    const stored = readSocietyState();
    setSociety(stored.society);
    setAnalysis(stored.analysis);
    setEnvironmentAnalysis(stored.environmentAnalysis);
  }, []);

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!society || !analysis || !selectedCompany) {
      setError("학회 분석과 기업 선택이 필요합니다.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const scoreResponse = await fetch("/api/score-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ society, analysis, environmentAnalysis, company: selectedCompany })
      });
      const scorePayload = await scoreResponse.json();
      if (!scoreResponse.ok) throw new Error(scorePayload.error || "기업 평가에 실패했습니다.");

      const proposalResponse = await fetch("/api/generate-project-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          society,
          analysis,
          company: selectedCompany,
          scoreContext: scorePayload.data,
          preferredCollaborationType,
          desiredProjectDuration,
          capabilitiesToEmphasize,
          proposalTemplateName,
          proposalTemplateText,
          tone,
          outputLength
        })
      });
      const proposalPayload = await proposalResponse.json();
      if (!proposalResponse.ok) throw new Error(proposalPayload.error || "프로젝트 제안 생성에 실패했습니다.");

      setScoreContext(scorePayload.data);
      setOutput(proposalPayload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTemplateUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setProposalTemplateFile(file);
    setProposalTemplateName(file.name);
    setIsTemplateLoading(true);
    setTemplateError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/extract-file-content", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "템플릿 파일을 읽지 못했습니다.");
      setProposalTemplateText(payload.data.text || BIT_TEMPLATE_GUIDE);
    } catch (caught) {
      setTemplateError(caught instanceof Error ? caught.message : "템플릿 파일을 읽는 중 문제가 발생했습니다.");
    } finally {
      setIsTemplateLoading(false);
    }
  }

  async function handleDownloadProposal() {
    if (!output) return;

    try {
      if (useCustomTemplate && proposalTemplateFile && proposalTemplateFile.name.toLowerCase().endsWith(".pptx")) {
        const pptxBlob = await buildFilledTemplatePptx(proposalTemplateFile, output, selectedCompany?.name || "대상 기업");
        downloadBlob(pptxBlob, `${safeFileName(selectedCompany?.name || "기업")}_${safeFileName(proposalTemplateName || "맞춤")}_제안서.pptx`);
        return;
      }

      downloadBlob(
        new Blob([buildProposalMarkdown(output, selectedCompany?.name || "대상 기업", proposalTemplateName, desiredProjectDuration)], { type: "text/markdown;charset=utf-8" }),
        `${safeFileName(selectedCompany?.name || "기업")}_산학협력_제안서.md`
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "산출물 파일을 만드는 중 문제가 발생했습니다.");
    }
  }

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="프로젝트 제안 생성"
        title="기업별 협업 제안서를 작성합니다"
        description="선택한 기업의 니즈와 학회의 역량을 연결해 실제 산학협력·기업 프로젝트 제안서 형식으로 정리합니다."
      />

      {!society || !analysis ? (
        <EmptyState title="먼저 학회 분석이 필요합니다" description="학회 프로필 화면에서 정보를 입력하면 프로젝트 제안을 생성할 수 있습니다." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={handleGenerate} className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4">
              <Field label="기업 선택">
                <select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="input">
                  {companyPool.map((company) => <option key={company.id} value={company.id}>{company.name} · {company.industry}</option>)}
                </select>
              </Field>
              <Field label="선호 협업 유형">
                <select value={preferredCollaborationType} onChange={(event) => setPreferredCollaborationType(event.target.value as CollaborationType)} className="input">
                  {Object.entries(collaborationTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="희망 프로젝트 기간">
                <input value={desiredProjectDuration} onChange={(event) => setDesiredProjectDuration(event.target.value)} className="input" />
              </Field>
              <Field label="강조할 학회 역량">
                <textarea value={capabilitiesToEmphasize} onChange={(event) => setCapabilitiesToEmphasize(event.target.value)} className="input min-h-24 resize-y" />
              </Field>
              <Field label="톤">
                <select value={tone} onChange={(event) => setTone(event.target.value as ProposalTone)} className="input">
                  {Object.entries(proposalToneLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="출력 길이">
                <select value={outputLength} onChange={(event) => setOutputLength(event.target.value as ProposalLength)} className="input">
                  {Object.entries(proposalLengthLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">제안서 포맷</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">포맷이 없으면 기본 정형 제안서로 생성하고, 포맷이 있으면 파일이나 텍스트를 반영합니다.</p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input type="checkbox" checked={useCustomTemplate} onChange={(event) => setUseCustomTemplate(event.target.checked)} />
                    내 포맷 사용
                  </label>
                </div>

                {useCustomTemplate ? (
                  <div className="mt-4 grid gap-3">
                    <Field label="포맷 이름">
                      <input value={proposalTemplateName} onChange={(event) => setProposalTemplateName(event.target.value)} className="input bg-white" placeholder="예: BIT 산학협력 제안서 템플릿" />
                    </Field>
                    <div className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">포맷 파일</span>
                      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        {isTemplateLoading ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />}
                        {isTemplateLoading ? "읽는 중" : "파일 선택"}
                        <input type="file" accept=".pptx,.pdf,.docx,.txt,.md" onChange={handleTemplateUpload} className="hidden" />
                      </label>
                      {proposalTemplateFile ? <p className="text-xs text-slate-500">{proposalTemplateFile.name}</p> : null}
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-700">포맷 설명/목차</span>
                        <button type="button" onClick={() => {
                          setProposalTemplateName("BIT 산학협력 제안서 템플릿");
                          setProposalTemplateText(BIT_TEMPLATE_GUIDE);
                          setUseCustomTemplate(true);
                        }} className="text-xs font-semibold text-cyan-800">
                          BIT 포맷 불러오기
                        </button>
                      </div>
                      <textarea
                        value={proposalTemplateText}
                        onChange={(event) => setProposalTemplateText(event.target.value)}
                        className="input min-h-36 resize-y bg-white"
                        placeholder="제안서 목차, 필수 항목, 슬라이드 구성, 문체 요구사항 등을 붙여넣어 주세요."
                      />
                    </div>
                    {templateError ? <ErrorBox message={templateError} /> : null}
                  </div>
                ) : (
                  <p className="mt-3 rounded-md bg-white p-3 text-xs leading-5 text-slate-600">기본 정형 제안서 목차로 생성됩니다. 산출물은 화면 복사 또는 마크다운 파일 다운로드로 제공됩니다.</p>
                )}
              </div>
            </div>

            {error ? <div className="mt-4"><ErrorBox message={error} /></div> : null}
            <div className="mt-5">
              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
                제안서 생성
              </PrimaryButton>
            </div>
          </form>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">제안서 미리보기</h2>
                <p className="mt-1 text-sm text-slate-500">기업 담당자가 검토할 수 있는 목차형 제안서입니다.</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {output ? (
                  <button type="button" onClick={handleDownloadProposal} className="inline-flex items-center gap-1 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                    <Download size={14} />산출물 다운로드
                  </button>
                ) : null}
                {scoreContext ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">적합도 {scoreContext.fitScore}</span> : null}
              </div>
            </div>

            {output ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">PROJECT PROPOSAL</div>
                  <h3 className="mt-2 text-2xl font-bold leading-tight text-slate-950">{output.proposalTitle}</h3>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                    <p><span className="font-semibold text-slate-900">대상 기업</span><br />{selectedCompany?.name || "선택 기업"}</p>
                    <p><span className="font-semibold text-slate-900">협업 유형</span><br />{collaborationTypeLabels[preferredCollaborationType]}</p>
                    <p><span className="font-semibold text-slate-900">예상 기간</span><br />{desiredProjectDuration}</p>
                  </div>
                </div>

                <div className="border-b border-slate-200 bg-cyan-50/60 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-950">1페이지 요약</p>
                    <CopyButton content={output.onePageSummary} />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{output.onePageSummary}</p>
                </div>

                <div className="divide-y divide-slate-200">
                  {[
                    ["01", "제안 배경", output.proposalBackground],
                    ["02", "기업 문제 정의", output.companyProblemDefinition],
                    ["03", "프로젝트 목표", output.projectGoals],
                    ["04", "핵심 질문", output.keyQuestions],
                    ["05", "수행 범위", output.scopeOfWork],
                    ["06", "방법론", output.methodology],
                    ["07", "일정/운영 방식", output.timelineAndOperation],
                    ["08", "예상 산출물", output.expectedDeliverables],
                    ["09", "기대효과", output.expectedImpact],
                    ["10", "학회 적합성", output.societyFit],
                    ["11", "협업 요청사항", output.collaborationRequests]
                  ].map(([number, title, content]) => (
                    <OutputSection key={title} number={number} title={title} content={content} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-md bg-slate-50 p-6 text-sm leading-6 text-slate-600">
                기업과 조건을 선택한 뒤 제안서 생성 버튼을 눌러주세요.
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-medium text-slate-700">{label}{children}</label>;
}

function CopyButton({ content }: { content: string }) {
  return (
    <button type="button" onClick={() => navigator.clipboard.writeText(content)} className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-800">
      <Clipboard size={13} />복사
    </button>
  );
}

function OutputSection({ number, title, content }: { number: string; title: string; content: string }) {
  return (
    <div className="grid gap-3 p-5 sm:grid-cols-[4rem_1fr]">
      <div className="text-xs font-bold text-cyan-800">{number}</div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-950">{title}</p>
          <CopyButton content={content} />
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{content}</p>
      </div>
    </div>
  );
}

function buildProposalMarkdown(output: ProjectProposalOutput, companyName: string, templateName: string, duration: string) {
  return `# ${output.proposalTitle}

- 대상 기업: ${companyName}
- 제안 포맷: ${templateName}
- 예상 기간: ${duration}

## 1페이지 요약
${output.onePageSummary}

## 제안 배경
${output.proposalBackground}

## 기업 문제 정의
${output.companyProblemDefinition}

## 프로젝트 목표
${output.projectGoals}

## 핵심 질문
${output.keyQuestions}

## 수행 범위
${output.scopeOfWork}

## 방법론
${output.methodology}

## 일정/운영 방식
${output.timelineAndOperation}

## 예상 산출물
${output.expectedDeliverables}

## 기대효과
${output.expectedImpact}

## 학회 적합성
${output.societyFit}

## 협업 요청사항
${output.collaborationRequests}
`;
}

async function buildFilledTemplatePptx(templateFile: File, output: ProjectProposalOutput, companyName: string) {
  const zip = await JSZip.loadAsync(await templateFile.arrayBuffer());
  const replacementsBySlide: Record<string, Record<string, string>> = {
    "ppt/slides/slide1.xml": {
      "기업명": companyName
    },
    "ppt/slides/slide2.xml": {
      "기업명": companyName
    },
    "ppt/slides/slide4.xml": {
      "기업명": companyName,
      "본문": compactForSlide(`${output.proposalBackground}\n\n${output.companyProblemDefinition}\n\n${output.keyQuestions}`, 420)
    },
    "ppt/slides/slide5.xml": {
      "기업명": companyName,
      "본문": compactForSlide(`${output.projectGoals}\n\n${output.scopeOfWork}\n\n${output.expectedImpact}`, 420)
    },
    "ppt/slides/slide6.xml": {
      "기업명": companyName
    },
    "ppt/slides/slide7.xml": {
      "기업명": companyName
    },
    "ppt/slides/slide8.xml": {
      "기업명": companyName
    },
    "ppt/slides/slide9.xml": {
      "기업명": companyName
    }
  };

  for (const [path, replacements] of Object.entries(replacementsBySlide)) {
    const file = zip.file(path);
    if (!file) continue;
    const xml = await file.async("string");
    zip.file(path, replaceSlideText(xml, {
      ...replacements,
      "주제": output.proposalTitle,
      "최종 아웃풋": "최종 아웃풋",
      "프로젝트 기간": "프로젝트 기간"
    }, path));
  }

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  });
}

function replaceSlideText(xml: string, replacements: Record<string, string>, path: string) {
  return xml.replace(/(<a:t[^>]*>)([\s\S]*?)(<\/a:t>)/g, (match, open: string, rawText: string, close: string) => {
    const text = decodeXml(rawText);

    if (text === "기업명") {
      return `${open}${escapeXml(replacements["기업명"] || text)}${close}`;
    }

    if (text === "본문" && replacements["본문"]) {
      return `${open}${escapeXml(replacements["본문"])}${close}`;
    }

    if (path.endsWith("slide4.xml") && text === "주제") {
      return `${open}${escapeXml(compactForSlide(replacements["주제"] || text, 42))}${close}`;
    }

    if (path.endsWith("slide5.xml") && text === "주제") {
      return `${open}${escapeXml("수행 범위 및 기대효과")}${close}`;
    }

    return match;
  });
}

function compactForSlide(value: string, maxLength: number) {
  const compacted = value.replace(/\n{3,}/g, "\n\n").trim();
  return compacted.length > maxLength ? `${compacted.slice(0, maxLength - 1)}…` : compacted;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeXml(value: string) {
  return value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}
