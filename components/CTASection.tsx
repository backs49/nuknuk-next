"use client";

import { motion } from "framer-motion";
import FadeIn from "./FadeIn";
import { useReservation } from "./ReservationProvider";

export default function CTASection() {
  const { openReservation } = useReservation();

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-sage-400 via-sage-300 to-sage-400" />

      {/* 장식 요소 */}
      <motion.div
        className="absolute top-10 left-[10%] w-40 h-40 rounded-full bg-white/10 blur-3xl"
        animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-10 right-[10%] w-60 h-60 rounded-full bg-white/5 blur-3xl"
        animate={{ y: [20, -20, 20] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center px-5">
        <FadeIn>
          <p className="text-sm tracking-[0.2em] text-white/70 font-medium mb-4">
            RESERVATION
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
            넉넉한 한 입,
            <br />
            지금 예약하세요.
          </h2>
          <p className="text-white/80 text-lg mb-10 leading-relaxed">
            정성 가득 수제 디저트를 준비해 드립니다.
            <br />
            최소 2일 전 예약 부탁드려요.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={openReservation}
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-white text-sage-400 font-bold text-base hover:bg-cream-100 active:scale-95 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              지금 예약하기
            </button>
            <a
              href="https://naver.me/xOxTmNiu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-white/20 backdrop-blur text-white font-bold text-base border border-white/30 hover:bg-white/30 active:scale-95 transition-all duration-300"
            >
              네이버 예약
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
