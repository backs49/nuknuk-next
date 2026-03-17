"use client";

import { motion } from "framer-motion";
import { useReservation } from "./ReservationProvider";

export default function HeroSection() {
  const { openReservation } = useReservation();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 배경 — 다층 그라데이션 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cream-100 via-cream-200 to-warm-100" />

        {/* 대형 장식 블러 원 */}
        <div className="absolute top-[15%] right-[15%] w-[400px] h-[400px] rounded-full bg-sage-100/50 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-blush-100/40 blur-[100px]" />
        <div className="absolute top-[50%] left-[40%] w-[300px] h-[300px] rounded-full bg-warm-200/30 blur-[80px]" />

        {/* "裕" 워터마크 — 브랜드 아이덴티티 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[20rem] md:text-[28rem] lg:text-[36rem] font-serif text-warm-200/[0.08] leading-none">
            裕
          </span>
        </div>

        {/* 미세 도트 패턴 오버레이 */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#4A4A4A" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dots)" />
        </svg>
      </div>

      {/* 떠다니는 장식 요소 */}
      <motion.div
        className="absolute top-1/4 left-[10%] w-20 h-20 rounded-full bg-sage-200/40 blur-xl"
        animate={{ y: [-20, 20, -20] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/3 right-[15%] w-32 h-32 rounded-full bg-blush-200/40 blur-xl"
        animate={{ y: [20, -20, 20] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[60%] left-[25%] w-16 h-16 rounded-full bg-warm-300/30 blur-lg"
        animate={{ y: [-15, 15, -15], x: [-8, 8, -8] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 text-center px-5 max-w-3xl mx-auto">
        <motion.p
          className="text-sm md:text-base tracking-[0.3em] text-sage-400 font-medium mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          NUKNUK DESSERT
        </motion.p>

        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-charcoal-400 leading-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <span className="whitespace-nowrap">재료도, 정성도, 마음도.</span>
          <br />
          <span className="text-sage-400">넉넉</span>
          <span className="text-charcoal-200 text-3xl md:text-4xl lg:text-5xl">(裕)</span>
          <span className="whitespace-nowrap">하게 담았습니다.</span>
        </motion.h1>

        <motion.p
          className="text-base md:text-lg text-charcoal-200 leading-relaxed mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          부족함 없이 채워드리고 싶은
          <br />
          주인장의 마음을 한 입 가득 느껴보세요.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <a href="#menu" className="btn-primary text-base">
            메뉴 보기
          </a>
          <button
            onClick={openReservation}
            className="btn-secondary text-base"
          >
            예약하기
          </button>
        </motion.div>

        {/* 스크롤 유도 */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-charcoal-100/50 flex justify-center pt-2">
            <div className="w-1 h-2 bg-charcoal-100/50 rounded-full" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
