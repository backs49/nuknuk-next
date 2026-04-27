import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | 넉넉 디저트",
  description: "넉넉 디저트의 개인정보 처리방침입니다.",
  robots: { index: true, follow: true },
};

const BUSINESS = {
  serviceName: "넉넉 디저트",
  companyName: "넉넉할유",
  ceoName: "도유리",
  bizRegNo: "114-28-64011",
  mailOrderNo: "2026-경북영천-0070",
  address: "경상북도 영천시 서문길 90, A동(성내동)",
  phone: "0507-1328-3934",
  privacyOfficerName: "도유리 (대표)",
  privacyOfficerKakaoChannel: "http://pf.kakao.com/_paCxdn",
  effectiveDate: "2026년 4월 22일",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-100 pt-24 pb-16 px-5 md:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-charcoal-400 mb-2">
            개인정보 처리방침
          </h1>
          <p className="text-sm text-charcoal-300 mb-10">
            시행일: {BUSINESS.effectiveDate}
          </p>

          <div className="space-y-10 text-charcoal-300 leading-relaxed text-[15px]">
            <section>
              <p>
                {BUSINESS.companyName}(&lsquo;{BUSINESS.serviceName}&rsquo;, 이하
                &lsquo;회사&rsquo;)는 이용자의 개인정보를 중요시하며, 「개인정보
                보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」
                등 관련 법령을 준수하고 있습니다. 본 개인정보 처리방침은 회사가
                운영하는 온라인 주문/결제 서비스(이하 &lsquo;서비스&rsquo;)에
                적용됩니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제1조 수집하는 개인정보 항목 및 수집 방법
              </h2>
              <p className="mb-2">
                회사는 다음과 같은 개인정보를 수집합니다.
              </p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-charcoal-400">
                    가. 주문·결제 시 (필수)
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>주문자 성함</li>
                    <li>연락처(휴대전화번호)</li>
                    <li>
                      배송지 주소 (택배 수령을 선택한 경우에 한함)
                    </li>
                    <li>결제 정보 (결제 수단, 결제 승인 정보 — 토스페이먼츠를 통해 처리)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-charcoal-400">
                    나. 주문·결제 시 (선택)
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>이메일 주소</li>
                    <li>요청사항(주문 메모)</li>
                    <li>픽업 희망일</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-charcoal-400">
                    다. 서비스 이용 과정에서 자동 수집되는 정보
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>접속 IP 주소 (부정 이용 방지 및 요청 제한 목적)</li>
                    <li>접속 일시, 서비스 이용 기록</li>
                    <li>쿠키 (관리자 로그인 유지 목적)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-charcoal-400">
                    라. 수집 방법
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>주문·결제 페이지 입력</li>
                    <li>결제대행사(토스페이먼츠)로부터의 결제 결과 수신</li>
                    <li>서비스 이용 과정에서의 자동 생성 정보</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제2조 개인정보의 수집·이용 목적
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>주문 접수, 상품 제조 및 준비, 픽업·배송 안내</li>
                <li>결제 처리 및 결제 결과 확인</li>
                <li>주문 관련 안내 (카카오 알림톡, 이메일, 전화)</li>
                <li>포인트 적립·사용 및 쿠폰 발급·사용 내역 관리</li>
                <li>주문 조회, 고객 문의 응대 및 환불 처리</li>
                <li>부정 주문·중복 요청 방지 및 서비스 안정성 확보</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제3조 개인정보의 보유 및 이용 기간
              </h2>
              <p className="mb-2">
                회사는 개인정보의 수집·이용 목적이 달성된 후에는 해당 정보를
                지체 없이 파기합니다. 단, 관계 법령에 따라 보존할 필요가 있는
                경우 아래와 같이 일정 기간 보관합니다.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  계약 또는 청약 철회 등에 관한 기록: 5년 (전자상거래 등에서의
                  소비자 보호에 관한 법률)
                </li>
                <li>
                  대금 결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래 등에서의
                  소비자 보호에 관한 법률)
                </li>
                <li>
                  소비자의 불만 또는 분쟁처리에 관한 기록: 3년
                </li>
                <li>
                  표시·광고에 관한 기록: 6개월
                </li>
                <li>
                  전자금융 거래에 관한 기록: 5년 (전자금융거래법)
                </li>
                <li>
                  웹사이트 방문기록(로그): 3개월 (통신비밀보호법)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제4조 개인정보의 제3자 제공
              </h2>
              <p className="mb-2">
                회사는 이용자의 개인정보를 제1조에서 고지한 범위 내에서만
                이용하며, 이용자의 사전 동의 없이는 본 범위를 초과하여 이용하거나
                원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우에는
                예외로 합니다.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>이용자가 사전에 동의한 경우</li>
                <li>
                  택배 배송을 위해 배송사에 성함·연락처·주소를 제공하는 경우
                  (택배 이용 시에 한함)
                </li>
                <li>
                  법령의 규정에 의하거나 수사 목적으로 법령에 정해진 절차와
                  방법에 따라 수사기관의 요구가 있는 경우
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제5조 개인정보 처리의 위탁
              </h2>
              <p className="mb-2">
                회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리를
                위탁하고 있으며, 관련 법령에 따라 위탁계약 시 개인정보의 안전한
                관리를 위하여 필요한 사항을 규정하고 있습니다.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-charcoal-100/30">
                  <thead className="bg-warm-200/40">
                    <tr>
                      <th className="border border-charcoal-100/30 px-3 py-2 text-left">
                        수탁업체
                      </th>
                      <th className="border border-charcoal-100/30 px-3 py-2 text-left">
                        위탁 업무
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        토스페이먼츠(주)
                      </td>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        결제 처리 및 결제 결과 확인
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        (주)솔라피
                      </td>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        카카오 알림톡·문자 발송
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        Supabase Inc.
                      </td>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        데이터베이스 및 파일 스토리지 운영
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        Vercel Inc.
                      </td>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        웹사이트 호스팅
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        Upstash Inc.
                      </td>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        요청 제한(Rate Limit) 처리 — 접속 IP
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        Google LLC (Gmail)
                      </td>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        주문 확인 이메일 발송
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제6조 이용자의 권리와 행사 방법
              </h2>
              <p className="mb-2">
                이용자는 언제든지 아래 권리를 행사할 수 있습니다.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>개인정보 열람 요구</li>
                <li>오류가 있는 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리 정지 요구</li>
              </ul>
              <p className="mt-2">
                권리 행사는 아래 개인정보 보호책임자의 연락처로 요청하실 수
                있으며, 회사는 지체 없이 조치하겠습니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제7조 개인정보의 파기 절차 및 방법
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  파기 절차: 이용 목적이 달성된 개인정보는 내부 방침에 따라
                  관련 법령에서 정한 기간 동안 보관된 후 파기됩니다.
                </li>
                <li>
                  파기 방법: 전자적 파일 형태의 정보는 복구 및 재생이 불가능한
                  방법으로 삭제하며, 종이 문서는 분쇄하거나 소각하여 파기합니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제8조 개인정보의 안전성 확보 조치
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  관리적 조치: 개인정보 취급자 최소화 및 교육
                </li>
                <li>
                  기술적 조치: 전송 구간 암호화(HTTPS), 관리자 계정 접근 통제,
                  주문 조회 페이지의 접근 토큰 검증, 요청 횟수 제한(Rate Limit)
                </li>
                <li>
                  물리적 조치: 데이터는 클라우드 서비스 사업자의 보안 시설 내에
                  보관되며, 물리적 접근이 통제됩니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제9조 쿠키의 운용
              </h2>
              <p>
                회사는 관리자 로그인 세션 유지를 위해 쿠키를 사용합니다. 일반
                이용자에게는 별도의 쿠키가 설치되지 않습니다. 이용자는 브라우저
                설정에서 쿠키 저장을 거부할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제10조 개인정보 보호책임자
              </h2>
              <div className="bg-warm-200/30 p-4 rounded-lg">
                <p>
                  <span className="font-medium">성함:</span>{" "}
                  {BUSINESS.privacyOfficerName}
                </p>
                <p>
                  <span className="font-medium">연락처:</span> {BUSINESS.phone}
                </p>
                <p>
                  <span className="font-medium">카카오톡 채널:</span>{" "}
                  <a
                    href={BUSINESS.privacyOfficerKakaoChannel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sage-400 underline hover:text-sage-500"
                  >
                    넉넉 디저트 채널 바로가기
                  </a>
                </p>
              </div>
              <p className="mt-2 text-sm">
                개인정보 관련 문의·열람·정정·삭제 요청은 대표 전화 또는
                위 카카오톡 채널을 통해 접수해주시면 지체 없이 조치하겠습니다.
              </p>
              <p className="mt-3 text-sm">
                개인정보 침해에 대한 신고·상담은 아래 기관에도 문의할 수
                있습니다.
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1 text-sm">
                <li>
                  개인정보분쟁조정위원회 (www.kopico.go.kr / 1833-6972)
                </li>
                <li>
                  개인정보침해신고센터 (privacy.kisa.or.kr / 118)
                </li>
                <li>대검찰청 사이버수사과 (www.spo.go.kr / 1301)</li>
                <li>경찰청 사이버수사국 (cyberbureau.police.go.kr / 182)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제11조 사업자 정보
              </h2>
              <div className="bg-warm-200/30 p-4 rounded-lg space-y-1">
                <p>
                  <span className="font-medium">상호:</span>{" "}
                  {BUSINESS.companyName}
                </p>
                <p>
                  <span className="font-medium">대표자:</span>{" "}
                  {BUSINESS.ceoName}
                </p>
                <p>
                  <span className="font-medium">사업장 주소:</span>{" "}
                  {BUSINESS.address}
                </p>
                <p>
                  <span className="font-medium">대표 전화:</span>{" "}
                  {BUSINESS.phone}
                </p>
                <p>
                  <span className="font-medium">사업자등록번호:</span>{" "}
                  {BUSINESS.bizRegNo}
                </p>
                <p>
                  <span className="font-medium">통신판매업 신고번호:</span>{" "}
                  {BUSINESS.mailOrderNo}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제12조 개인정보 처리방침의 변경
              </h2>
              <p>
                본 개인정보 처리방침은 법령·정책 또는 서비스 운영 방침의 변경에
                따라 내용이 추가·삭제 및 수정될 수 있으며, 변경 시 웹사이트를
                통해 공지합니다.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
