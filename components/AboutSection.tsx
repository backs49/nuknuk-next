"use client";

import { motion } from "framer-motion";
import FadeIn from "./FadeIn";

// 브랜드 가치 패널 데이터 — "재료도, 정성도, 마음도 넉넉하게"
const brandValues = [
  {
    label: "재료",
    character: "材",
    description: "국내산 쌀, 햅쑥, 참기름.\n좋은 재료를 아낌없이.",
    gradient: "from-warm-200 via-warm-100 to-cream-200",
    accent: "bg-warm-300",
    iconBg: "bg-warm-300/20",
  },
  {
    label: "정성",
    character: "誠",
    description: "하나하나 수제로,\n시간을 아끼지 않습니다.",
    gradient: "from-sage-100 via-cream-100 to-sage-100",
    accent: "bg-sage-400",
    iconBg: "bg-sage-200/30",
  },
  {
    label: "마음",
    character: "心",
    description: "받는 분의 기쁨이\n넉넉해지도록.",
    gradient: "from-blush-100 via-cream-100 to-blush-100",
    accent: "bg-blush-400",
    iconBg: "bg-blush-200/30",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="section-padding bg-white/50">
      <div className="max-w-6xl mx-auto">
        {/* 섹션 헤더 */}
        <FadeIn className="text-center mb-16">
          <p className="text-sm tracking-[0.2em] text-sage-400 font-medium mb-3">
            WHY &apos;NUKNUK&apos;?
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-charcoal-400">
            우리는 이름 그대로
            <br />
            <span className="text-sage-400">&apos;넉넉함(裕)&apos;</span> 을 팝니다.
          </h2>
        </FadeIn>

        {/* 콘텐츠 그리드 */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* 텍스트 영역 */}
          <FadeIn direction="left" className="order-2 md:order-1">
            <div className="space-y-6 text-base md:text-lg leading-relaxed text-charcoal-200">
              <p>
                퍽퍽한 세상 속에서 디저트 하나만큼은
                <br />
                마음 놓고 풍족하게 즐기셨으면 하는 바람입니다.
              </p>
              <p>
                재료를 아끼면 맛이 덜하고,
                <br />
                시간을 아끼면 정성이 덜하기에
                <br />
                <span className="text-charcoal-400 font-semibold">
                  미련할 만큼, 넘치도록 담습니다.
                </span>
              </p>
              <p>
                오시는 발걸음 가볍게,
                <br />
                돌아가시는 마음은 넉넉하게.
              </p>
              <p className="text-sage-400 font-medium italic font-display text-xl">
                그것이 우리가 매일 떡을 찌는 이유입니다.
              </p>
            </div>
          </FadeIn>

          {/* 브랜드 가치 패널 */}
          <FadeIn direction="right" className="order-1 md:order-2">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {brandValues.map((value, index) => (
                <motion.div
                  key={value.label}
                  className={`relative rounded-2xl overflow-hidden bg-gradient-to-b ${value.gradient} p-4 md:p-6 flex flex-col items-center justify-center text-center shadow-lg`}
                  style={{
                    aspectRatio: index === 1 ? "3/5" : "3/4",
                    marginTop: index === 1 ? "2rem" : "0",
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                >
                  {/* 도트 패턴 */}
                  <svg
                    className="absolute inset-0 w-full h-full opacity-[0.04]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id={`about-dots-${index}`}
                        x="0"
                        y="0"
                        width="20"
                        height="20"
                        patternUnits="userSpaceOnUse"
                      >
                        <circle cx="2" cy="2" r="0.8" fill="currentColor" />
                      </pattern>
                    </defs>
                    <rect
                      width="100%"
                      height="100%"
                      fill={`url(#about-dots-${index})`}
                    />
                  </svg>

                  {/* 장식 블러 원 */}
                  <div
                    className={`absolute -top-4 -right-4 w-20 h-20 rounded-full ${value.iconBg} blur-2xl`}
                  />

                  {/* 한자 워터마크 */}
                  <span className="text-6xl md:text-7xl font-serif text-charcoal-400/[0.06] absolute top-2 right-2 leading-none select-none">
                    {value.character}
                  </span>

                  {/* 콘텐츠 */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    {/* 액센트 도트 */}
                    <div className={`w-2 h-2 rounded-full ${value.accent}`} />

                    {/* 라벨 */}
                    <h3 className="text-lg md:text-xl font-bold text-charcoal-400">
                      {value.label}
                    </h3>

                    {/* 설명 */}
                    <p className="text-xs md:text-sm text-charcoal-200 leading-relaxed whitespace-pre-line">
                      {value.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
