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
              {/* TODO: 네이버 예약 실제 링크로 교체 */}
              <a
                href="#"
                className="block hover:text-white transition-colors"
              >
                🗓 네이버 예약
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center text-xs text-white/30">
          <p>© {new Date().getFullYear()} 넉넉 디저트 (Nuknuk Dessert). All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
