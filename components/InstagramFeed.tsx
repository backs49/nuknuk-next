"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import FadeIn from "./FadeIn";
import {
  instagramPostUrls,
  INSTAGRAM_USERNAME,
  INSTAGRAM_PROFILE_URL,
} from "@/data/instagram";

/**
 * Instagram 피드 섹션
 *
 * 구현 방식:
 * 1. data/instagram.ts에 게시물 URL이 있으면 → 공식 Instagram Embed로 표시
 * 2. URL이 없으면 → Instagram 프로필 임베드만 표시
 *
 * 업그레이드 방법은 data/instagram.ts 파일 상단 주석 참고
 */

// Instagram embed.js 스크립트 로드
function useInstagramEmbed() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => {
      loaded.current = true;
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
    };
    document.body.appendChild(script);
  }, []);
}

// Instagram 글로벌 타입 선언
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

// === 공식 Instagram Embed로 개별 게시물 표시 ===
function InstagramEmbedPosts({ urls }: { urls: string[] }) {
  useInstagramEmbed();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {urls.slice(0, 9).map((url, index) => (
        <motion.div
          key={url}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.4, delay: index * 0.08 }}
          className="flex justify-center"
        >
          <blockquote
            className="instagram-media"
            data-instgrm-captioned
            data-instgrm-permalink={url}
            data-instgrm-version="14"
            style={{
              background: "#FFF",
              border: 0,
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              margin: 0,
              maxWidth: "100%",
              minWidth: "280px",
              padding: 0,
              width: "100%",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// === Instagram 프로필 임베드 (게시물 URL 미등록 시) ===
function InstagramProfileEmbed() {
  return (
    <FadeIn className="flex justify-center">
      <div className="w-full max-w-lg">
        <iframe
          src={`https://www.instagram.com/${INSTAGRAM_USERNAME}/embed`}
          className="w-full border-0 rounded-2xl shadow-xl"
          style={{ minHeight: "480px" }}
          loading="lazy"
          title={`@${INSTAGRAM_USERNAME} 인스타그램 프로필`}
        />
      </div>
    </FadeIn>
  );
}

// === 메인 컴포넌트 ===
export default function InstagramFeed() {
  const hasPostUrls = instagramPostUrls.length > 0;

  return (
    <section id="instagram" className="section-padding">
      <div className="max-w-7xl mx-auto">
        {/* 섹션 헤더 */}
        <FadeIn className="text-center mb-12">
          <p className="text-sm tracking-[0.2em] text-sage-400 font-medium mb-3">
            INSTAGRAM
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-charcoal-400 mb-4">
            @{INSTAGRAM_USERNAME}
          </h2>
          <p className="text-charcoal-200">
            넉넉한 일상을 공유합니다
          </p>
        </FadeIn>

        {/* 게시물 URL이 등록되어 있으면 공식 Embed, 없으면 프로필 임베드 */}
        {hasPostUrls ? (
          <InstagramEmbedPosts urls={instagramPostUrls} />
        ) : (
          <InstagramProfileEmbed />
        )}

        {/* Instagram 바로가기 */}
        <FadeIn delay={0.3} className="text-center mt-10">
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Instagram에서 더 보기 →
          </a>
        </FadeIn>
      </div>
    </section>
  );
}
