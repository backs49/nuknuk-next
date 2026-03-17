"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { menuItems, formatPrice } from "@/data/menu";

/**
 * ============================================================
 * Calendly 설정 가이드
 * ============================================================
 *
 * 1단계: Calendly 무료 계정 만들기
 *   - https://calendly.com 접속 → "Get started for free" 클릭
 *   - Google/Microsoft 계정으로 간편 가입 가능
 *
 * 2단계: 이벤트 유형 만들기
 *   - 로그인 후 "Create Event Type" 클릭
 *   - "One-on-One" 선택
 *   - 이벤트 이름: "넉넉 디저트 예약"
 *   - 소요시간: 30분 (또는 원하는 시간)
 *   - 가용 시간 설정: 매장 운영시간에 맞게 설정
 *     예) 월~금 10:00~18:00, 토 10:00~15:00
 *   - "Save & Close"
 *
 * 3단계: 예약 페이지 URL 복사
 *   - 생성된 이벤트의 링크 복사
 *   - 형식: https://calendly.com/your-username/event-name
 *   - 예: https://calendly.com/nuknuk-dessert/reservation
 *
 * 4단계: 아래 CALENDLY_URL 상수에 URL 붙여넣기
 *   - 빈 문자열("")이면 Calendly 섹션이 숨겨지고
 *     Instagram DM / 네이버 예약 버튼만 표시됩니다
 *
 * 5단계: Calendly 추가 설정 (선택)
 *   - Calendly 대시보드에서:
 *     → 예약 시 수집할 정보 설정 (이름, 전화번호, 메뉴 선택 등)
 *     → 확인 이메일 / 리마인더 자동 발송 설정
 *     → Google Calendar / Naver Calendar 연동
 *   - URL 파라미터로 테마 커스터마이징:
 *     ?hide_event_type_details=1  → 이벤트 상세 숨기기
 *     ?hide_gdpr_banner=1        → GDPR 배너 숨기기
 *     ?background_color=fdfbf7   → 배경색을 사이트와 맞추기
 *     ?text_color=4a4a4a         → 텍스트 색상 맞추기
 *     ?primary_color=6b8e23      → 강조색을 sage-400과 맞추기
 *
 * 예시 (커스터마이징 적용):
 * const CALENDLY_URL = "https://calendly.com/nuknuk-dessert/reservation?background_color=fdfbf7&text_color=4a4a4a&primary_color=6b8e23";
 * ============================================================
 */
const CALENDLY_URL = "";

// 네이버 예약 URL — 실제 링크로 교체하세요
const NAVER_BOOKING_URL = "https://naver.me/xOxTmNiu";

// 인스타그램 DM URL
const INSTAGRAM_DM_URL = "https://www.instagram.com/nuknuk_dessert/";

// 인기 메뉴 3개 추출 (isPopular가 true인 항목 중 상위 3개)
const popularMenuItems = menuItems
  .filter((item) => item.isPopular)
  .slice(0, 3);

// 예약 시 주의사항
const reservationNotices = [
  "모든 디저트는 100% 예약제로 운영됩니다.",
  "최소 2일 전까지 예약 부탁드립니다.",
  "예약 확정 후 취소·변경은 1일 전까지 가능합니다.",
  "당일 취소 시 다음 예약이 제한될 수 있습니다.",
  "알레르기가 있으시면 예약 시 꼭 말씀해 주세요.",
];

// 카테고리 아이콘 매핑
const categoryIcon: Record<string, string> = {
  "rice-cake": "🍡",
  cake: "🎂",
  cookie: "🍪",
  beverage: "🍵",
};

// 모달 애니메이션 variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.97,
    transition: { duration: 0.2 },
  },
};

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReservationModal({
  isOpen,
  onClose,
}: ReservationModalProps) {
  // body 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  const hasCalendly = CALENDLY_URL.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          {/* 오버레이 (클릭 시 닫힘) */}
          <motion.div
            className="absolute inset-0 bg-charcoal-400/50 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* 모달 본체 */}
          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-cream-100 shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="예약하기"
          >
            {/* 상단 헤더 */}
            <div className="sticky top-0 z-10 bg-cream-100/95 backdrop-blur-md border-b border-warm-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-xl md:text-2xl font-display font-bold text-charcoal-400">
                  넉넉 디저트 예약하기
                </h2>
                <p className="text-sm text-charcoal-100 mt-0.5">
                  100% 예약제 · 최소 2일 전 예약
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-warm-100 hover:bg-warm-200 flex items-center justify-center transition-colors text-charcoal-300"
                aria-label="닫기"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 4l10 10M14 4L4 14" />
                </svg>
              </button>
            </div>

            {/* 모달 콘텐츠 */}
            <div className="px-6 py-6 space-y-8">
              {/* ───── Calendly 임베드 섹션 ───── */}
              {hasCalendly ? (
                <section>
                  <h3 className="text-sm font-semibold text-sage-400 tracking-wider uppercase mb-4">
                    날짜 & 시간 선택
                  </h3>
                  <div className="rounded-2xl overflow-hidden border border-warm-100 shadow-inner bg-white">
                    {/*
                     * Calendly 인라인 임베드
                     * CALENDLY_URL 상수를 설정하면 여기에 캘린더가 표시됩니다.
                     * 높이는 내용에 맞게 조정하세요 (최소 630px 권장).
                     */}
                    <iframe
                      src={CALENDLY_URL}
                      className="w-full border-0"
                      style={{ minHeight: "630px" }}
                      loading="lazy"
                      title="넉넉 디저트 예약 캘린더"
                    />
                  </div>
                </section>
              ) : (
                /* Calendly 미설정 시 안내 메시지 */
                <section className="relative rounded-2xl bg-gradient-to-br from-sage-100/50 via-cream-200 to-warm-100/50 p-8 text-center overflow-hidden">
                  {/* 장식 요소 */}
                  <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-sage-200/20 blur-2xl" />
                  <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full bg-warm-200/20 blur-2xl" />

                  <div className="relative z-10">
                    <span className="text-4xl mb-3 block">📅</span>
                    <p className="text-lg font-semibold text-charcoal-400 mb-2">
                      예약은 아래 방법으로 가능합니다
                    </p>
                    <p className="text-sm text-charcoal-200">
                      Instagram DM 또는 네이버 예약을 이용해주세요
                    </p>
                  </div>
                </section>
              )}

              {/* ───── 대체 예약 방법 ───── */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-warm-100" />
                  <span className="text-xs text-charcoal-100 whitespace-nowrap">
                    {hasCalendly
                      ? "또는 다른 방법으로 예약"
                      : "예약 방법"}
                  </span>
                  <div className="h-px flex-1 bg-warm-100" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Instagram DM 예약 */}
                  <a
                    href={INSTAGRAM_DM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-warm-100 hover:border-sage-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 via-pink-500 to-orange-400 flex items-center justify-center text-white text-lg flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal-400 text-sm group-hover:text-sage-400 transition-colors">
                        Instagram DM 예약
                      </p>
                      <p className="text-xs text-charcoal-100">
                        @nuknuk_dessert
                      </p>
                    </div>
                  </a>

                  {/* 네이버 예약 */}
                  <a
                    href={NAVER_BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-warm-100 hover:border-sage-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#03C75A] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      N
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal-400 text-sm group-hover:text-sage-400 transition-colors">
                        네이버 예약
                      </p>
                      <p className="text-xs text-charcoal-100">
                        네이버에서 바로 예약
                      </p>
                    </div>
                  </a>
                </div>
              </section>

              {/* ───── 인기 메뉴 추천 ───── */}
              {popularMenuItems.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-sage-400 tracking-wider uppercase mb-4">
                    인기 메뉴
                  </h3>
                  <div className="space-y-2">
                    {popularMenuItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-warm-100/50"
                      >
                        {/* 카테고리 아이콘 */}
                        <div className="w-10 h-10 rounded-lg bg-cream-200 flex items-center justify-center text-lg flex-shrink-0">
                          {categoryIcon[item.category] || "🍽"}
                        </div>

                        {/* 메뉴 정보 */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-charcoal-400 text-sm truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-charcoal-100 truncate">
                            {item.description}
                          </p>
                        </div>

                        {/* 가격 */}
                        <span className="text-sm font-bold text-sage-400 whitespace-nowrap">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <a
                    href="#menu"
                    onClick={onClose}
                    className="inline-block mt-3 text-xs text-sage-400 hover:text-sage-500 transition-colors"
                  >
                    전체 메뉴 보기 →
                  </a>
                </section>
              )}

              {/* ───── 예약 시 주의사항 ───── */}
              <section>
                <h3 className="text-sm font-semibold text-sage-400 tracking-wider uppercase mb-4">
                  예약 시 주의사항
                </h3>
                <div className="rounded-2xl bg-warm-100/30 border border-warm-100/50 p-5">
                  <ul className="space-y-2.5">
                    {reservationNotices.map((notice, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-charcoal-200"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sage-300 mt-1.5 flex-shrink-0" />
                        {notice}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            {/* 하단 고정 CTA (모바일에서 특히 유용) */}
            <div className="sticky bottom-0 bg-cream-100/95 backdrop-blur-md border-t border-warm-100 px-6 py-4 rounded-b-3xl">
              <a
                href={INSTAGRAM_DM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full text-center text-sm"
              >
                Instagram DM으로 예약하기
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
