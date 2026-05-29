import Link from "next/link";
import type React from "react";
import { ArrowRight, BarChart3, Building2, CheckCircle2, FileText, MailPlus, Network, ShieldCheck, Sparkles, UsersRound } from "lucide-react";

const capabilities = [
  {
    title: "학회 맥락 구조화",
    description: "소개자료, 활동 이력, 역량을 기업 협업 관점의 포지셔닝으로 정리합니다.",
    icon: UsersRound
  },
  {
    title: "협업 후보 발굴",
    description: "학회의 관심 산업과 강점을 바탕으로 컨택할 만한 기업 후보를 탐색합니다.",
    icon: Building2
  },
  {
    title: "제안서와 이메일 연결",
    description: "기업별 문제 상황에 맞춘 제안 방향과 콜드메일 초안을 이어서 생성합니다.",
    icon: MailPlus
  }
];

const steps = [
  "학회 정보와 소개자료 입력",
  "AI 기반 포지셔닝 분석",
  "기업 후보와 적합도 확인",
  "제안서와 콜드메일 생성"
];

const previewItems = [
  { label: "학회 포지셔닝", value: "협업 제안형", tone: "bg-teal-400" },
  { label: "기업 적합도", value: "87점", tone: "bg-emerald-400" },
  { label: "다음 액션", value: "콜드메일", tone: "bg-amber-300" }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f4f7f8] text-slate-950">
      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#eef6f6_58%,#f4f7f8_100%)] text-slate-950">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 md:px-8">
        <nav className="flex items-center justify-between gap-4 rounded-lg border border-white/70 bg-white/75 px-4 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white shadow-sm">
              <UsersRound size={20} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-950">SocietyBridge AI</p>
              <p className="text-xs font-medium text-slate-500">학회용 기업 협업 발굴</p>
            </div>
          </Link>
          <Link
            href="/profile"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-900"
          >
            서비스 바로가기
            <ArrowRight size={16} />
          </Link>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white/80 px-3 py-1.5 text-xs font-bold text-teal-800 shadow-sm backdrop-blur">
              <Sparkles size={14} />
              대학 학회와 기업 협업을 잇는 작업대
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.16] text-slate-950 md:text-5xl">
              <span className="block">학회의 강점을</span>
              <span className="block">기업이 이해하는 협업 제안으로</span>
              <span className="block">바꿉니다</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              SocietyBridge AI는 학회 소개자료와 활동 이력을 분석해 협업 포지셔닝, 기업 후보, 프로젝트 제안 방향, 콜드메일까지 한 흐름으로 정리하는 산학협력 아웃리치 서비스입니다.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/profile" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-teal-900">
                서비스 바로가기
                <ArrowRight size={16} />
              </Link>
              <a
                href="#overview"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white"
              >
                서비스 흐름 보기
              </a>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <Metric value="4단계" label="입력부터 컨택까지" />
              <Metric value="한국어" label="분석 결과 정리" />
              <Metric value="공개 정보" label="연락 채널 기준" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-white/80 bg-white/70 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white" />
            <div className="pointer-events-none absolute -top-24 right-8 h-44 w-44 rounded-full bg-white/70 blur-3xl" />
            <div className="relative rounded-lg border border-white/70 bg-white/80 p-4 text-slate-950 shadow-inner shadow-white backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-teal-700">실행 화면 미리보기</p>
                  <p className="mt-1 text-xl font-bold">기업 협업 발굴 보드</p>
                </div>
                <div className="rounded-md border border-teal-100 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800">분석 준비</div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <DashboardTile icon={<FileText size={17} />} title="학회 입력" value="프로필" />
                <DashboardTile icon={<BarChart3 size={17} />} title="AI 분석" value="포지셔닝" />
                <DashboardTile icon={<Building2 size={17} />} title="기업 찾기" value="후보 발굴" />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {previewItems.map((item) => (
                  <div key={item.label} className="rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                      <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                    </div>
                    <p className="mt-2 text-lg font-bold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-4 grid gap-3 rounded-lg border border-white/70 bg-white/85 p-3 shadow-sm backdrop-blur">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-sm font-bold text-slate-700 shadow-sm">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{step}</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-teal-700" style={{ width: `${35 + index * 18}%` }} />
                    </div>
                  </div>
                  <CheckCircle2 className="shrink-0 text-teal-700" size={18} />
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </section>

      <section id="overview" className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 md:px-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-bold text-teal-700">서비스 개요</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">무엇을 도와주나요?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              학회가 가진 경험을 기업 입장에서 읽히는 협업 제안 언어로 바꾸고, 다음 액션으로 바로 넘어갈 수 있게 정리합니다.
            </p>
            <div className="mt-5 rounded-lg border border-teal-100 bg-teal-50 p-4 text-sm leading-7 text-slate-700">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 shrink-0 text-teal-800" size={18} />
                <p>연락처는 공개된 채널과 사용자가 제공한 정보만 기준으로 표시합니다.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-teal-800 shadow-sm">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-white md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-sm font-bold text-teal-200">준비되셨나요?</p>
            <p className="mt-1 text-xl font-bold">학회 정보를 입력하고 협업 후보를 찾아보세요.</p>
          </div>
          <Link href="/profile" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-teal-50">
            서비스 시작하기
            <Network size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-lg font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function DashboardTile({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm">
      <div className="flex items-center gap-2 text-teal-800">
        {icon}
        <span className="text-xs font-bold text-slate-600">{title}</span>
      </div>
      <p className="mt-3 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}
