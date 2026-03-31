"use client";

import { useState, useEffect } from "react";

interface BannerData {
  text: string;
  link: string;
  bgColor: string;
  textColor: string;
}

export default function AnnouncementBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 오늘 하루 안보기 체크
    const dismissedDate = localStorage.getItem("banner_dismissed");
    if (dismissedDate === new Date().toISOString().slice(0, 10)) {
      setDismissed(true);
      return;
    }

    // 배너 설정 조회
    fetch("/api/banner")
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled && data.text) {
          setBanner({
            text: data.text,
            link: data.link || "",
            bgColor: data.bgColor || "#6B8E23",
            textColor: data.textColor || "#FFFFFF",
          });
        }
      })
      .catch(() => {});
  }, []);

  if (dismissed || !banner) return null;

  const handleDismiss = () => {
    localStorage.setItem(
      "banner_dismissed",
      new Date().toISOString().slice(0, 10)
    );
    setDismissed(true);
  };

  const content = (
    <span className="text-sm font-medium leading-snug">{banner.text}</span>
  );

  return (
    <div
      className="relative flex items-center justify-center px-10 py-2.5 text-center"
      style={{ backgroundColor: banner.bgColor, color: banner.textColor }}
    >
      {banner.link ? (
        <a
          href={banner.link}
          target={banner.link.startsWith("http") ? "_blank" : undefined}
          rel={banner.link.startsWith("http") ? "noopener noreferrer" : undefined}
          className="hover:underline"
        >
          {content}
        </a>
      ) : (
        content
      )}
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity text-sm"
        style={{ color: banner.textColor }}
        aria-label="오늘 하루 안보기"
        title="오늘 하루 안보기"
      >
        ✕
      </button>
    </div>
  );
}
