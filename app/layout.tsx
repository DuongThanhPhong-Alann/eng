import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "ENGLOCAL | Ôn tập tiếng Anh",
  description: "Không gian luyện tập từ vựng tiếng Anh vui nhộn, sinh động và hiệu quả dành cho học sinh." ,
  icons: { icon: "/englocal-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <footer className="site-footer">ENGLOCAL <span>✦</span> Mỗi ngày tiến bộ một chút <span>·</span> Tự tin chinh phục bài thi Tiếng Anh</footer>
      </body>
    </html>
  );
}
