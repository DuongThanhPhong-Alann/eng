import Link from "next/link";
import { BookOpenCheck, History, House } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Trang chủ Học Vui">
          <span className="brand-mark"><BookOpenCheck size={21} strokeWidth={2.4} /></span>
          <span>Học Vui<span className="brand-dot">.</span></span>
        </Link>
        <nav className="top-nav" aria-label="Điều hướng chính">
          <Link href="/" className="nav-link"><House size={17} /> Trang chủ</Link>
          <Link href="/history" className="nav-link"><History size={17} /> Lịch sử</Link>
        </nav>
        <span className="header-note"><span className="online-dot" /> Cùng học mỗi ngày</span>
      </div>
    </header>
  );
}
