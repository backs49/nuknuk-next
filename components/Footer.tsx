import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-charcoal-400 text-white/60 py-12 px-5 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {/* 브랜드 */}
          <div>
            <Link href="/" className="inline-block mb-3">
              <span className="text-2xl font-display font-bold text-white">
                넉넉
              </span>
              <span className="text-xs text-white/40 tracking-widest uppercase ml-2">
                Dessert
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              재료도, 정성도, 마음도.
              <br />
              넉넉(裕)하게 담았습니다.
            </p>
          </div>

          {/* 매장 정보 */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">매장 정보</h4>
            <div className="space-y-2 text-sm">
              <p>📍 경북 영천시 서문길 90 A동</p>
              <p>🚗 영천제일교회 맞은편 태평아파트 바로 앞</p>
              <p>🅿️ 매장 앞 주차 가능</p>
              <p>
                📞{" "}
                <a
                  href="tel:0507-1328-3934"
                  className="hover:text-white transition-colors"
                >
                  0507.1328.3934
                </a>
              </p>
              <p>📅 100% 예약제 운영</p>
            </div>
          </div>

          {/* SNS & 예약 */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">
              예약 & SNS
            </h4>
            <div className="space-y-2 text-sm">
              <a
                href="https://www.instagram.com/nuknuk_dessert/"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-white transition-colors"
              >
                📸 @nuknuk_dessert
              </a>
              <a
                href="http://pf.kakao.com/_paCxdn"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-white transition-colors"
              >
                💬 카카오톡 채널
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-xs text-white/30 space-y-3">
          <div className="space-y-1 leading-relaxed">
            <p>
              <span className="text-white/50">상호</span> 넉넉할유
              <span className="mx-2 text-white/20">|</span>
              <span className="text-white/50">대표자</span> 도유리
            </p>
            <p>
              <span className="text-white/50">사업자등록번호</span> 114-28-64011
              <span className="mx-2 text-white/20">|</span>
              <span className="text-white/50">통신판매업신고번호</span> 2026-경북영천-0070
            </p>
            <p>
              <span className="text-white/50">사업장 소재지</span> 경상북도 영천시 서문길 90, A동(성내동)
            </p>
            <p>
              <span className="text-white/50">전화</span>{" "}
              <a
                href="tel:0507-1328-3934"
                className="hover:text-white transition-colors"
              >
                0507-1328-3934
              </a>
            </p>
          </div>
          <div className="pt-3 border-t border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                개인정보 처리방침
              </Link>
              <Link
                href="/refund-policy"
                className="hover:text-white transition-colors"
              >
                청약철회·환불 규정
              </Link>
            </div>
            <p>© {new Date().getFullYear()} 넉넉할유 (넉넉 디저트). All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
