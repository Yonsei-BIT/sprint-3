import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "SocietyBridge AI",
  description: "학회의 비전과 역량을 분석해 협업 가능성이 높은 기업, 기업별 프로젝트 제안 방향, 콜드메일을 자동 생성하는 AI 기반 산학협력 아웃리치 웹앱"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
