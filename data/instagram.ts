/**
 * Instagram 게시물 데이터
 *
 * 사용법:
 * 1. Instagram에서 게시물 열기
 * 2. 게시물 우측 상단 "..." 클릭 → "링크 복사"
 * 3. 아래 배열에 URL 추가 (최대 9개 권장)
 *
 * 예시 URL 형식:
 * - https://www.instagram.com/p/ABC123/
 * - https://www.instagram.com/reel/ABC123/
 *
 * ⚠️ 아래 URL들을 @nuknuk_dessert 계정의 실제 게시물 URL로 교체하세요!
 */

export const instagramPostUrls: string[] = [
  // TODO: 실제 @nuknuk_dessert 게시물 URL로 교체하세요
  // 아래는 예시입니다. 인스타그램 앱에서 각 게시물의 링크를 복사해서 넣으세요.
  //
  // "https://www.instagram.com/p/게시물코드1/",
  // "https://www.instagram.com/p/게시물코드2/",
  // "https://www.instagram.com/p/게시물코드3/",
];

export const INSTAGRAM_USERNAME = "nuknuk_dessert";
export const INSTAGRAM_PROFILE_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;

/**
 * ========================================
 * Instagram API 업그레이드 가이드
 * ========================================
 *
 * 현재: 공식 Instagram Embed (수동으로 게시물 URL 관리)
 * 목표: Instagram Graph API로 최신 게시물 자동 표시
 *
 * === 방법 1: Instagram Graph API (권장) ===
 *
 * 1단계: Meta 개발자 계정 설정
 *   - https://developers.facebook.com 접속 → 앱 만들기
 *   - 앱 유형: "비즈니스" 선택
 *   - Instagram Graph API 추가
 *
 * 2단계: Instagram 비즈니스 계정 연결
 *   - @nuknuk_dessert를 비즈니스/크리에이터 계정으로 전환
 *   - Facebook 페이지와 연결
 *   - 앱에서 Instagram 비즈니스 로그인 설정
 *
 * 3단계: 액세스 토큰 발급
 *   - Graph API Explorer에서 장기 토큰 발급
 *   - 필요한 권한: instagram_basic, pages_show_list
 *   - 토큰은 60일마다 갱신 필요 (자동화 권장)
 *
 * 4단계: Next.js API 라우트 구현
 *   - app/api/instagram/route.ts 생성
 *   - 환경변수: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID
 *   - API 엔드포인트: https://graph.instagram.com/{user-id}/media
 *     ?fields=id,caption,media_url,permalink,timestamp,media_type
 *     &limit=9
 *     &access_token={token}
 *   - 응답 캐싱: revalidate 3600 (1시간) 권장
 *
 * 5단계: .env.local 설정
 *   INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
 *   INSTAGRAM_USER_ID=your_user_id
 *
 * === 방법 2: 서드파티 위젯 (가장 간단) ===
 *
 * - Elfsight (https://elfsight.com/instagram-feed-widget/)
 *   → 무료 플랜 제공, 스크립트 한 줄로 적용
 *
 * - Behold (https://behold.so/)
 *   → 개발자 친화적, React 컴포넌트 제공
 *   → npm install @behold/react
 *
 * - SnapWidget (https://snapwidget.com/)
 *   → 무료 플랜으로 6개 게시물까지 표시 가능
 */
