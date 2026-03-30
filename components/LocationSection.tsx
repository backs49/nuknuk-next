"use client";

import FadeIn from "./FadeIn";

export default function LocationSection() {
  return (
    <section id="location" className="section-padding bg-white/50">
      <div className="max-w-6xl mx-auto">
        {/* 섹션 헤더 */}
        <FadeIn className="text-center mb-16">
          <p className="text-sm tracking-[0.2em] text-sage-400 font-medium mb-3">
            LOCATION
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-charcoal-400">
            오시는 길
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          {/* 지도 임베드 */}
          <FadeIn direction="left">
            {/*
              네이버 지도 임베드
              - 네이버 지도에서 해당 장소 검색 후 "공유" → "지도 퍼가기"로 임베드 URL 획득
              - 아래는 주소 기반 검색 URL 예시 (실제 매장 등록 후 정확한 place ID로 교체 권장)

              카카오맵 임베드 대안:
              1. https://map.kakao.com 에서 장소 검색
              2. "공유" → "퍼가기" 선택
              3. 제공되는 iframe src URL로 아래 src를 교체하세요

              카카오맵 JavaScript API 사용 시:
              1. https://developers.kakao.com 에서 앱 등록
              2. JavaScript 키 발급
              3. next.config.mjs에 kakao SDK 스크립트 추가
              4. KakaoMap 컴포넌트를 별도로 만들어 사용
            */}
            {/*
              네이버 지도 임베드 방법:
              1. map.naver.com 에서 "경북 영천시 서문길 90" 검색
              2. 좌측 패널 하단 "공유" 버튼 클릭
              3. "지도 퍼가기" 탭 선택
              4. 생성된 iframe의 src URL을 아래에 붙여넣기
              ※ map.naver.com/p/... URL은 iframe 차단됨 — 반드시 "퍼가기" 전용 URL 사용
            */}
            <div className="relative w-full overflow-hidden rounded-2xl shadow-xl bg-cream-200" style={{ paddingBottom: "75%" }}>
              <iframe
                src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=%EA%B2%BD%EB%B6%81+%EC%98%81%EC%B2%9C%EC%8B%9C+%EC%84%9C%EB%AC%B8%EA%B8%B8+90&zoom=16&language=ko"
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="넉넉 디저트 위치"
              />
            </div>
            {/* 지도 앱 바로가기 버튼 */}
            <div className="flex gap-3 mt-4">
              <a
                href="https://map.naver.com/p/search/%EA%B2%BD%EB%B6%81%20%EC%98%81%EC%B2%9C%EC%8B%9C%20%EC%84%9C%EB%AC%B8%EA%B8%B8%2090"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-[#03C75A] text-white text-center text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-md"
              >
                네이버 지도로 보기
              </a>
              <a
                href="https://map.kakao.com/link/search/경북 영천시 서문길 90"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-[#FEE500] text-charcoal-400 text-center text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-md"
              >
                카카오맵으로 보기
              </a>
            </div>
          </FadeIn>

          {/* 매장 정보 */}
          <FadeIn direction="right">
            <div className="space-y-8">
              {/* 주소 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center text-xl">
                  📍
                </div>
                <div>
                  <h3 className="font-bold text-charcoal-400 mb-1">주소</h3>
                  <p className="text-charcoal-200">경북 영천시 서문길 90 A동</p>
                </div>
              </div>

              {/* 오시는 길 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center text-xl">
                  🚗
                </div>
                <div>
                  <h3 className="font-bold text-charcoal-400 mb-1">
                    오시는 길
                  </h3>
                  <p className="text-charcoal-200">
                    영천제일교회 맞은편 태평아파트 바로 앞
                  </p>
                </div>
              </div>

              {/* 주차 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center text-xl">
                  🅿️
                </div>
                <div>
                  <h3 className="font-bold text-charcoal-400 mb-1">주차 안내</h3>
                  <p className="text-charcoal-200">
                    매장 앞 주차 가능
                  </p>
                </div>
              </div>

              {/* 예약 안내 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blush-100 flex items-center justify-center text-xl">
                  📅
                </div>
                <div>
                  <h3 className="font-bold text-charcoal-400 mb-1">예약 안내</h3>
                  <p className="text-charcoal-200">
                    모든 디저트는{" "}
                    <span className="font-semibold text-sage-400">
                      100% 예약제
                    </span>
                    로 운영됩니다.
                    <br />
                    최소 2일 전 카카오톡 채널로 예약해 주세요.
                  </p>
                </div>
              </div>

              {/* 전화번호 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center text-xl">
                  📞
                </div>
                <div>
                  <h3 className="font-bold text-charcoal-400 mb-1">전화 문의</h3>
                  <a href="tel:0507-1328-3934" className="text-charcoal-200 hover:text-sage-400 transition-colors">
                    0507.1328.3934
                  </a>
                </div>
              </div>

              {/* 예약 버튼 */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <a
                  href="http://pf.kakao.com/_paCxdn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-sm flex-1"
                >
                  💬 카카오톡 예약
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
