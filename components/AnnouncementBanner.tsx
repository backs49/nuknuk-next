"use client";

import { useState, useEffect, useRef } from "react";

interface BannerData {
  text: string;
  link: string;
  bgColor: string;
  textColor: string;
}

export default function AnnouncementBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dismissedDate = localStorage.getItem("banner_dismissed");
    if (dismissedDate === new Date().toISOString().slice(0, 10)) {
      setDismissed(true);
      return;
    }

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

  // 배너 높이를 CSS 변수로 설정 → 헤더가 이를 참조
  useEffect(() => {
    if (banner && !dismissed && bannerRef.current) {
      const h = bannerRef.current.offsetHeight;
      document.documentElement.style.setProperty("--banner-height", `${h}px`);
    } else {
      document.documentElement.style.setProperty("--banner-height", "0px");
    }
  }, [banner, dismissed]);

  if (dismissed || !banner) return null;

  const handleDismiss = () => {
    localStorage.setItem(
      "banner_dismissed",
      new Date().toISOString().slice(0, 10)
    );
    document.documentElement.style.setProperty("--banner-height", "0px");
    setDismissed(true);
  };

  const content = (
    <span className="text-sm font-medium leading-snug">{banner.text}</span>
  );

  return (
    <div
      ref={bannerRef}
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center px-10 py-2.5 text-center"
      style={{ backgroundColor: banner.bgColor, color: banner.textColor }}
    >
      {banner.link ? (
        <a
          href={banner.link}
          target={banner.link.startsWith("http") ? "_blank" : undefined}
          rel={
            banner.link.startsWith("http") ? "noopener noreferrer" : undefined
          }
          className="hover:underline"
        >
          {content}
        </a>
      ) : (
        content
      )}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity text-base"
        style={{ color: banner.textColor }}
        aria-label="오늘 하루 안보기"
        title="오늘 하루 안보기"
      >
        ✕
      </button>
    </div>
  );
}
