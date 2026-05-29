"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookmarkPlus, Clipboard, Loader2, Send } from "lucide-react";

import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState, ErrorBox, PageHeader, PrimaryButton } from "@/components/ui";
import { emailCtaLabels, emailLengthLabels, emailPurposeLabels, emailToneLabels } from "@/lib/labels";
import { companyPool, findCompanyById } from "@/lib/mockData";
import { readSavedCompanies, readSocietyState, saveLatestColdEmail, writeSavedCompanies } from "@/lib/storage";
import type { ColdEmailOutput, CompanyScore, EmailCta, EmailLength, EmailPurpose, EmailTone, EnvironmentAnalysis, SavedCompany, SocietyAnalysis, SocietyProfileInput } from "@/lib/types";

export default function EmailPage() {
  return (
    <Suspense fallback={<DashboardShell><EmptyState title="불러오는 중입니다" description="콜드 이메일 생성 화면을 준비하고 있습니다." /></DashboardShell>}>
      <EmailContent />
    </Suspense>
  );
}

function EmailContent() {
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get("company") || companyPool[0]?.id || "";
  const [society, setSociety] = useState<SocietyProfileInput | null>(null);
  const [analysis, setAnalysis] = useState<SocietyAnalysis | null>(null);
  const [environmentAnalysis, setEnvironmentAnalysis] = useState<EnvironmentAnalysis | null>(null);
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [purpose, setPurpose] = useState<EmailPurpose>("industry_academic_collaboration");
  const [tone, setTone] = useState<EmailTone>("student_organization");
  const [length, setLength] = useState<EmailLength>("short_email");
  const [cta, setCta] = useState<EmailCta>("request_meeting");
  const [senderName, setSenderName] = useState("");
  const [senderRole, setSenderRole] = useState("");
  const [optionalAttachmentMention, setOptionalAttachmentMention] = useState("소개자료를 함께 전달드릴 수 있습니다.");
  const [scoreContext, setScoreContext] = useState<CompanyScore | null>(null);
  const [output, setOutput] = useState<ColdEmailOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

      const emailResponse = await fetch("/api/generate-cold-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          society,
          analysis,
          company: selectedCompany,
          purpose,
          tone,
          length,
          cta,
          senderName,
          senderRole,
          optionalAttachmentMention,
          scoreContext: scorePayload.data
        })
      });
      const emailPayload = await emailResponse.json();
      if (!emailResponse.ok) throw new Error(emailPayload.error || "콜드 이메일 생성에 실패했습니다.");

      setScoreContext(scorePayload.data);
      setOutput(emailPayload.data);
      saveLatestColdEmail(emailPayload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSave() {
    if (!selectedCompany || !output) return;
    const saved: SavedCompany = {
      id: `${selectedCompany.id}-${Date.now()}`,
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      industry: selectedCompany.industry,
      fitScore: scoreContext?.fitScore ?? 0,
      problemSituation: scoreContext?.expectedCompanyProblem || selectedCompany.likelyNeeds.join(", "),
      projectProposalDirection: scoreContext?.recommendedProjectDirection || selectedCompany.notes,
      contactChannel: selectedCompany.contact,
      generatedColdEmail: output.emailBody,
      notes: "콜드 이메일 생성 화면에서 저장됨",
      status: "not_contacted",
      savedAt: new Date().toISOString()
    };
    writeSavedCompanies([saved, ...readSavedCompanies()]);
  }

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="콜드 이메일 생성"
        title="기업별 맞춤 첫 연락 메시지를 만듭니다"
        description="학회 소개, 기업 선정 이유, 예상 문제, 협업 방향, 명확한 CTA가 들어간 이메일과 DM을 생성합니다."
      />

      {!society || !analysis ? (
        <EmptyState title="먼저 학회 분석이 필요합니다" description="학회 프로필 화면에서 정보를 입력하면 콜드 이메일을 생성할 수 있습니다." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={handleGenerate} className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4">
              <Field label="기업 선택">
                <select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="input">
                  {companyPool.map((company) => <option key={company.id} value={company.id}>{company.name} · {company.industry}</option>)}
                </select>
              </Field>
              <Field label="아웃리치 목적">
                <select value={purpose} onChange={(event) => setPurpose(event.target.value as EmailPurpose)} className="input">
                  {Object.entries(emailPurposeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="톤">
                <select value={tone} onChange={(event) => setTone(event.target.value as EmailTone)} className="input">
                  {Object.entries(emailToneLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="길이">
                <select value={length} onChange={(event) => setLength(event.target.value as EmailLength)} className="input">
                  {Object.entries(emailLengthLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="CTA">
                <select value={cta} onChange={(event) => setCta(event.target.value as EmailCta)} className="input">
                  {Object.entries(emailCtaLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="발신자 이름">
                <input value={senderName} onChange={(event) => setSenderName(event.target.value)} className="input" placeholder="예: 신정빈" />
              </Field>
              <Field label="발신자 역할">
                <input value={senderRole} onChange={(event) => setSenderRole(event.target.value)} className="input" placeholder="예: 대외협력팀장" />
              </Field>
              <Field label="첨부자료 언급">
                <input value={optionalAttachmentMention} onChange={(event) => setOptionalAttachmentMention(event.target.value)} className="input" />
              </Field>
            </div>

            {error ? <div className="mt-4"><ErrorBox message={error} /></div> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
                이메일 생성
              </PrimaryButton>
              <button type="button" onClick={handleSave} disabled={!output} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                <BookmarkPlus size={17} />저장
              </button>
            </div>
          </form>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">생성 결과</h2>
                <p className="mt-1 text-sm text-slate-500">복사 버튼으로 바로 사용할 수 있습니다.</p>
              </div>
              {scoreContext ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">적합도 {scoreContext.fitScore}</span> : null}
            </div>

            {output ? (
              <div className="mt-4 space-y-4">
                <OutputBlock title="이메일 제목 3개" content={output.subjectLines.join("\n")} />
                <OutputBlock title="개인화 콜드 이메일" content={output.emailBody} />
                <OutputBlock title="짧은 LinkedIn DM 버전" content={output.shortLinkedInDm} />
                <OutputBlock title="후속 이메일" content={output.followUpEmailMessage} />
                <OutputBlock title="한 문장 피치" content={output.oneSentencePitch} />
                <OutputBlock title="추천 CTA 문장" content={output.suggestedCtaSentence} />
              </div>
            ) : (
              <div className="mt-4 rounded-md bg-slate-50 p-6 text-sm leading-6 text-slate-600">
                기업과 메시지 조건을 선택한 뒤 생성 버튼을 눌러주세요.
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

function OutputBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-950">{title}</p>
        <button type="button" onClick={() => navigator.clipboard.writeText(content)} className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-800">
          <Clipboard size={13} />복사
        </button>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{content}</p>
    </div>
  );
}
