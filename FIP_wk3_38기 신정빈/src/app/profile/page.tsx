"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, FileText, Loader2, Search, ShieldCheck, Upload, WandSparkles } from "lucide-react";

import { DashboardShell } from "@/components/DashboardShell";
import { Badge, ErrorBox, PageHeader, PrimaryButton } from "@/components/ui";
import { collaborationTypeLabels, societyTypeLabels } from "@/lib/labels";
import { readSocietyState, saveSocietyState } from "@/lib/storage";
import type { CollaborationType, SocietyAnalysis, SocietyProfileInput, SocietyType } from "@/lib/types";

const initialInput: SocietyProfileInput = {
  societyName: "",
  organizationType: "consulting_club",
  university: "",
  oneLineIntroduction: "",
  detailedIntroduction: "",
  visionAndDirection: "",
  mainActivities: "",
  pastProjects: "",
  coreCapabilities: "",
  industriesOfInterest: "",
  preferredCollaborationType: "industry_academic_collaboration",
  targetRegion: "한국",
  uploadedMaterialText: ""
};

export default function HomePage() {
  const [form, setForm] = useState<SocietyProfileInput>(initialInput);
  const [analysis, setAnalysis] = useState<SocietyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileMessage, setFileMessage] = useState("");
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  const requiredFields = [form.societyName, form.oneLineIntroduction];
  const completedRequiredCount = requiredFields.filter((value) => value.trim().length > 0).length;
  const progressValue = Math.round((completedRequiredCount / requiredFields.length) * 100);
  const profileReady = completedRequiredCount === requiredFields.length;
  const resultStatus = analysis ? "분석 완료" : isLoading ? "분석 중" : "대기 중";

  useEffect(() => {
    const stored = readSocietyState();
    if (stored.society) setForm(stored.society);
    if (stored.analysis) setAnalysis(stored.analysis);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze-society", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "학회 분석에 실패했습니다.");

      setAnalysis(payload.data);
      setDemoMode(Boolean(payload.demoMode));
      saveSocietyState(form, payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setFileMessage("");
    setIsFileLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/extract-file-content", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "파일 내용 추출에 실패했습니다.");

      setForm((current) => ({
        ...current,
        uploadedMaterialText: payload.data.text
      }));
      setFileMessage(
        `${payload.data.fileName}에서 분석용 내용을 불러왔습니다.${
          payload.data.truncated ? " 긴 문서는 앞부분 20,000자만 반영했습니다." : ""
        }${payload.data.demoMode ? " 이미지 해석은 API 키가 없어 데모 안내문으로 대체했습니다." : ""}`
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "파일 내용 추출 중 문제가 발생했습니다.");
    } finally {
      setIsFileLoading(false);
    }
  }

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="학회 협업 발굴 대시보드"
        title="학회 입력에서 기업 발굴까지 한 화면에서 정리합니다"
        description="학회의 방향성, 활동, 프로젝트 경험을 구조화해 기업 협업 탐색으로 이어지는 출발점을 만듭니다."
        action={
          <div className="flex flex-wrap gap-2">
            <Badge tone={profileReady ? "green" : "amber"}>{profileReady ? "필수 입력 완료" : "필수 입력 대기"}</Badge>
            <Badge tone={analysis ? "green" : "slate"}>{resultStatus}</Badge>
          </div>
        }
      />

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <WorkflowCard
          icon={<ClipboardList size={18} />}
          title="학회 정보"
          value={`${progressValue}%`}
          description="이름과 한 줄 소개가 채워지면 분석을 시작할 수 있습니다."
          tone="teal"
        />
        <WorkflowCard
          icon={<WandSparkles size={18} />}
          title="협업 포지셔닝"
          value={resultStatus}
          description="비전, 역량, 프로젝트 주제를 기업 제안 언어로 정리합니다."
          tone="slate"
        />
        <WorkflowCard
          icon={<Search size={18} />}
          title="다음 단계"
          value={analysis ? "기업 찾기" : "입력 보강"}
          description={analysis ? "분석 결과를 바탕으로 후보 기업 탐색으로 이동할 수 있습니다." : "자료 업로드나 활동 이력을 더하면 결과 품질이 좋아집니다."}
          tone="emerald"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">학회 입력 보드</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">기업 협업 적합도를 판단할 수 있도록 조직의 맥락과 강점을 입력하세요.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
              필수 {completedRequiredCount}/{requiredFields.length}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="학회/조직 이름">
              <input required value={form.societyName} onChange={(event) => setForm({ ...form, societyName: event.target.value })} className="input" placeholder="예: BIT" />
            </Field>
            <Field label="조직 유형">
              <select value={form.organizationType} onChange={(event) => setForm({ ...form, organizationType: event.target.value as SocietyType })} className="input">
                {Object.entries(societyTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="대학교">
              <input value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} className="input" placeholder="예: 연세대학교" />
            </Field>
            <Field label="관심 산업">
              <input value={form.industriesOfInterest} onChange={(event) => setForm({ ...form, industriesOfInterest: event.target.value })} className="input" placeholder="예: 핀테크, 모빌리티, 리테일" />
            </Field>
            <Field label="한 줄 소개" className="md:col-span-2">
              <input required value={form.oneLineIntroduction} onChange={(event) => setForm({ ...form, oneLineIntroduction: event.target.value })} className="input" placeholder="예: 기업의 실제 문제를 리서치와 전략 제안으로 해결하는 대학생 컨설팅 학회" />
            </Field>
            <Field label="상세 소개" className="md:col-span-2">
              <textarea value={form.detailedIntroduction} onChange={(event) => setForm({ ...form, detailedIntroduction: event.target.value })} className="input min-h-28 resize-y" placeholder="조직의 역사, 구성원, 운영 방식, 강점을 적어주세요." />
            </Field>
            <Field label="비전과 방향성" className="md:col-span-2">
              <textarea value={form.visionAndDirection} onChange={(event) => setForm({ ...form, visionAndDirection: event.target.value })} className="input min-h-24 resize-y" placeholder="앞으로 어떤 산업, 역량, 협업 방향을 키우고 싶은지 적어주세요." />
            </Field>
            <Field label="주요 활동">
              <textarea value={form.mainActivities} onChange={(event) => setForm({ ...form, mainActivities: event.target.value })} className="input min-h-24 resize-y" placeholder="세션, 리서치, 프로젝트, 스터디, 발표 등" />
            </Field>
            <Field label="과거 프로젝트/사례 경험">
              <textarea value={form.pastProjects} onChange={(event) => setForm({ ...form, pastProjects: event.target.value })} className="input min-h-24 resize-y" placeholder="기업 제안서, 산학협력, 시장 조사, 발표 사례 등" />
            </Field>
            <Field label="핵심 역량">
              <textarea value={form.coreCapabilities} onChange={(event) => setForm({ ...form, coreCapabilities: event.target.value })} className="input min-h-24 resize-y" placeholder="설문, IDI, 데이터 분석, 전략 기획, 디자인, 개발 등" />
            </Field>
            <Field label="선호 협업 유형">
              <select value={form.preferredCollaborationType} onChange={(event) => setForm({ ...form, preferredCollaborationType: event.target.value as CollaborationType })} className="input">
                {Object.entries(collaborationTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="목표 지역">
              <input value={form.targetRegion} onChange={(event) => setForm({ ...form, targetRegion: event.target.value })} className="input" placeholder="예: 한국, 서울, 글로벌" />
            </Field>
            <Field label="소개자료/제안서/브로슈어 자료" className="md:col-span-2">
              <div className="grid gap-3">
                <div className="rounded-lg border border-dashed border-teal-200 bg-teal-50/50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-teal-800 shadow-sm">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">파일 자료 업로드</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">PDF, Word, PowerPoint, Excel, 텍스트, 이미지 파일을 업로드하면 분석용 텍스트로 반영합니다.</p>
                      </div>
                    </div>
                    <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50">
                      {isFileLoading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                      {isFileLoading ? "읽는 중" : "파일 선택"}
                      <input
                        type="file"
                        accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.xlsx,.xls,text/plain,text/markdown,text/csv,application/json,.txt,.md,.csv,.json,image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
                        onChange={handleFileUpload}
                        disabled={isFileLoading}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  {fileMessage ? (
                    <p className="mt-3 flex items-start gap-2 text-xs font-semibold leading-5 text-emerald-700">
                      <CheckCircle2 className="mt-0.5 shrink-0" size={14} />
                      <span>{fileMessage}</span>
                    </p>
                  ) : null}
                </div>
                <textarea value={form.uploadedMaterialText} onChange={(event) => setForm({ ...form, uploadedMaterialText: event.target.value })} className="input min-h-32 resize-y" placeholder="자료 내용을 붙여넣거나 파일에서 불러오세요." />
              </div>
            </Field>
          </div>

          {error ? <div className="mt-4"><ErrorBox message={error} /></div> : null}

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <PrimaryButton type="submit" disabled={isLoading} className="sm:min-w-40">
              {isLoading ? <Loader2 className="animate-spin" size={17} /> : <WandSparkles size={17} />}
              {isLoading ? "분석 중" : "학회 분석하기"}
            </PrimaryButton>
            <p className="text-xs leading-5 text-slate-500">저장된 환경변수의 OpenAI API 키를 사용합니다.</p>
          </div>
        </form>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">AI 분석 결과</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">기업 컨택으로 이어질 핵심 메시지를 확인하세요.</p>
            </div>
            {demoMode ? <Badge tone="amber">데모 모드</Badge> : null}
          </div>

          {analysis ? (
            <div className="mt-4 space-y-4">
              <ResultBlock title="학회 요약" content={analysis.society_summary} />
              <ResultBlock title="비전 요약" content={analysis.vision_summary} />
              <ResultBlock title="전략 방향" content={analysis.strategic_direction} />
              <ResultBlock title="아웃리치 포지셔닝" content={analysis.outreach_positioning} />
              <BadgeGroup title="핵심 역량" items={analysis.core_capabilities} />
              <BadgeGroup title="잠재 프로젝트 주제" items={analysis.potential_project_themes} />
              <div className="grid gap-2 sm:grid-cols-2">
                <Link href="/analysis" className="action-link">내부/외부 분석 <ArrowRight size={16} /></Link>
                <Link href="/companies" className="action-link">기업 찾기 <ArrowRight size={16} /></Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-slate-700 shadow-sm">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">분석 결과가 여기에 표시됩니다</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">학회 정보를 입력하면 기업 협업에 필요한 포지셔닝, 적합 산업, 프로젝트 주제, 검색 키워드를 한국어로 정리합니다.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                <span className="rounded-md bg-white px-3 py-2">핵심 역량 정리</span>
                <span className="rounded-md bg-white px-3 py-2">협업 주제 도출</span>
                <span className="rounded-md bg-white px-3 py-2">아웃리치 포지셔닝</span>
                <span className="rounded-md bg-white px-3 py-2">기업 탐색 키워드</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function WorkflowCard({
  icon,
  title,
  value,
  description,
  tone
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  tone: "teal" | "slate" | "emerald";
}) {
  const toneClass = {
    teal: "border-teal-100 bg-teal-50 text-teal-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800"
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-lg border ${toneClass}`}>{icon}</div>
        <span className="rounded-md bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">{title}</span>
      </div>
      <p className="mt-4 text-xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`grid gap-2 text-sm font-semibold text-slate-700 ${className}`}><span>{label}</span>{children}</label>;
}

function ResultBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{content}</p>
    </div>
  );
}

function BadgeGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => <Badge key={item} tone="cyan">{item}</Badge>)}
      </div>
    </div>
  );
}
