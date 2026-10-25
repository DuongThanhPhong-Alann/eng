import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Học Vui · Ôn tập tiếng Anh",
  description: "Không gian luyện từ vựng tiếng Anh thân thiện dành cho học sinh.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <footer className="site-footer">Học Vui <span>·</span> Mỗi ngày tiến bộ một chút</footer>
      </body>
    </html>
  );
}
