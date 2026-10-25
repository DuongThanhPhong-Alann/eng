"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Flame, History, House, Volume2, VolumeX } from "lucide-react";
import { isSoundEnabled, playClickSound, playSelectSound, setSoundEnabled } from "@/lib/sound";

export function SiteHeader() {
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      // Phát âm thanh vui mừng khi vừa bật âm thanh
      setTimeout(() => playSelectSound(), 50);
    }
  };

  return (
    <header className="site-header">
      <div className="header-inner">
                <Link
          href="/"
          className="brand"
          aria-label="Trang chủ ENGLOCAL"
          onClick={() => playClickSound()}
        >
          <Image
            src="/englocal-logo.png"
            alt=""
            width={60}
            height={60}
            priority
            className="brand-logo"
          />
          <span className="brand-text">ENGLOCAL</span>
        </Link>

        <nav className="top-nav" aria-label="Điều hướng chính">
          <Link href="/" className="nav-link" onClick={() => playClickSound()}>
            <House size={18} />
            <span>Trang chủ</span>
          </Link>
          <Link href="/history" className="nav-link" onClick={() => playClickSound()}>
            <History size={18} />
            <span>Lịch sử học tập</span>
          </Link>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="sound-toggle-btn"
            onClick={toggleSound}
            title={soundOn ? "Đang bật âm thanh (Nhấn để tắt)" : "Đang tắt âm thanh (Nhấn để bật)"}
            aria-label="Bật tắt âm thanh"
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span className="sound-label">{soundOn ? "Âm thanh: Bật" : "Âm thanh: Tắt"}</span>
          </button>

          <div className="streak-badge" title="Chăm chỉ mỗi ngày nhé!">
            <Flame size={17} className="flame-icon" />
            <span>Mỗi ngày 1 chút!</span>
          </div>
        </div>
      </div>
    </header>
  );
}
