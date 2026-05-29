"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { CompanyCard } from "@/components/CompanyCard";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState, PageHeader } from "@/components/ui";
import { fallbackAnalyzeEnvironment, fallbackScoreCompany } from "@/lib/fallbacks";
import { companyPool, getCompaniesForSeed } from "@/lib/mockData";
import { readSocietyState, saveEnvironmentAnalysis } from "@/lib/storage";
import type { CompanyLead, CompanyScore, EnvironmentAnalysis, SocietyAnalysis, SocietyProfileInput } from "@/lib/types";

const COMPANY_COUNT_OPTIONS = [5, 10, 30] as const;
const COMPANY_SEED_STORAGE_KEY = "societybridge.companyCandidateSeed";
const COMPANY_COUNT_STORAGE_KEY = "societybridge.companyCandidateCount";
const DEFAULT_COMPANY_SEED = "societybridge-default";
type CompanyCount = (typeof COMPANY_COUNT_OPTIONS)[number];

export default function CompaniesPage() {
  const [society, setSociety] = useState<SocietyProfileInput | null>(null);
  const [analysis, setAnalysis] = useState<SocietyAnalysis | null>(null);
  const [environmentAnalysis, setEnvironmentAnalysis] = useState<EnvironmentAnalysis | null>(null);
  const [scores, setScores] = useState<Record<string, CompanyScore>>({});
  const [companySeed, setCompanySeed] = useState(DEFAULT_COMPANY_SEED);
  const [companyCount, setCompanyCount] = useState<CompanyCount>(30);

  const selectedCompanies = useMemo(() => getCompaniesForSeed(companySeed, companyCount), [companySeed, companyCount]);

  useEffect(() => {
    const stored = readSocietyState();
    setSociety(stored.society);
    setAnalysis(stored.analysis);
    setEnvironmentAnalysis(stored.environmentAnalysis);

    const storedCompanySeed = window.localStorage.getItem(COMPANY_SEED_STORAGE_KEY);
    if (storedCompanySeed) setCompanySeed(storedCompanySeed);

    const storedCompanyCount = Number(window.localStorage.getItem(COMPANY_COUNT_STORAGE_KEY));
    if (isCompanyCount(storedCompanyCount)) setCompanyCount(storedCompanyCount);
  }, []);

  useEffect(() => {
    if (!society || !analysis) return;

    let nextEnvironmentAnalysis = environmentAnalysis;
    if (!nextEnvironmentAnalysis) {
      nextEnvironmentAnalysis = fallbackAnalyzeEnvironment(society, analysis);
      setEnvironmentAnalysis(nextEnvironmentAnalysis);
      saveEnvironmentAnalysis(nextEnvironmentAnalysis);
    }

    const entries = selectedCompanies.map((company) => [
      company.id,
      fallbackScoreCompany(society, analysis, company, nextEnvironmentAnalysis)
    ] as const);
    setScores(Object.fromEntries(entries));
  }, [society, analysis, environmentAnalysis, selectedCompanies]);

  function handleRefreshCompanies() {
    const nextSeed = `societybridge-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(COMPANY_SEED_STORAGE_KEY, nextSeed);
    setScores({});
    setCompanySeed(nextSeed);
  }

  function handleChangeCompanyCount(nextCount: CompanyCount) {
    window.localStorage.setItem(COMPANY_COUNT_STORAGE_KEY, String(nextCount));
    setScores({});
    setCompanyCount(nextCount);
  }

  const sortedCompanies = [...selectedCompanies].sort((a, b) => {
    const tierDifference = tierRank(scores[a.id]) - tierRank(scores[b.id]);
    if (tierDifference !== 0) return tierDifference;
    return (scores[b.id]?.fitScore ?? 0) - (scores[a.id]?.fitScore ?? 0);
  });
  const groupedCompanies = groupByTier(sortedCompanies, scores);

  return (
    <DashboardShell>
      <PageHeader
        eyebrow="기업 찾기"
        title="학회가 컨택할 만한 기업을 우선순위로 보여줍니다"
        description="기업 문제 상황 분석을 기반으로, 어떤 기업이 해당 문제를 겪을 가능성이 높은지와 학회가 제안할 프로젝트 방향을 함께 평가합니다."
        action={society && analysis ? (
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
              {COMPANY_COUNT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChangeCompanyCount(option)}
                  className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
                    companyCount === option ? "bg-white text-cyan-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {option}개 보기
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleRefreshCompanies}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              새로운 {companyCount}개 보기
            </button>
          </div>
        ) : null}
      />

      {!society || !analysis ? (
        <EmptyState title="먼저 학회 분석이 필요합니다" description="학회 프로필 화면에서 정보를 입력하면 기업 적합도를 계산할 수 있습니다." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <span>
              현재 프로필: <strong className="text-slate-950">{society.societyName}</strong>
              <span className="ml-2 text-slate-400">전체 후보 {companyPool.length}개 중 {selectedCompanies.length}개 분석</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">1차 분류: 기업 Value Tier · 2차 분류: 적합도</span>
            <Link href="/profile" className="inline-flex items-center gap-2 font-semibold text-cyan-800"><ArrowLeft size={16} />학회 정보 수정</Link>
          </div>

          {groupedCompanies.map((group) => (
            <section key={group.tier} className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <h2 className="text-base font-bold text-slate-950">{group.tier}</h2>
                  <p className="mt-1 text-xs text-slate-500">{group.description}</p>
                </div>
                <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm">{group.companies.length}개</span>
              </div>
              <div className="grid gap-4">
                {group.companies.map((company) => (
                  <CompanyCard key={company.id} company={company} score={scores[company.id] || null} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function isCompanyCount(value: number): value is CompanyCount {
  return COMPANY_COUNT_OPTIONS.includes(value as CompanyCount);
}

function tierRank(score?: CompanyScore) {
  if (!score) return 4;
  if (score.priorityTier.includes("1")) return 1;
  if (score.priorityTier.includes("2")) return 2;
  if (score.priorityTier.includes("3")) return 3;
  return 4;
}

function groupByTier(companies: CompanyLead[], scores: Record<string, CompanyScore>) {
  return [
    {
      tier: "Tier 1",
      description: "네임드 기업, 대기업, 글로벌 기업처럼 협업 레퍼런스 가치와 브랜드 파급력이 큰 후보",
      companies: companies.filter((company) => tierRank(scores[company.id]) === 1)
    },
    {
      tier: "Tier 2",
      description: "특정 산업이나 2030 고객 접점에서 인지도가 높아 포트폴리오 가치가 충분한 후보",
      companies: companies.filter((company) => tierRank(scores[company.id]) === 2)
    },
    {
      tier: "Tier 3",
      description: "브랜드 파급력은 상대적으로 낮지만 문제 상황이 명확하면 파일럿으로 검토할 후보",
      companies: companies.filter((company) => tierRank(scores[company.id]) >= 3)
    }
  ].filter((group) => group.companies.length > 0);
}
