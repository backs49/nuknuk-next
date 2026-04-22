import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "청약철회 및 환불 규정 | 넉넉 디저트",
  description: "넉넉 디저트의 청약철회, 환불, 교환 및 반품 규정입니다.",
  robots: { index: true, follow: true },
};

const BUSINESS = {
  serviceName: "넉넉 디저트",
  companyName: "넉넉할유",
  phone: "0507-1328-3934",
  kakaoChannel: "http://pf.kakao.com/_paCxdn",
  effectiveDate: "2026년 4월 22일",
};

export default function RefundPolicyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-100 pt-24 pb-16 px-5 md:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-charcoal-400 mb-2">
            청약철회 및 환불 규정
          </h1>
          <p className="text-sm text-charcoal-300 mb-10">
            시행일: {BUSINESS.effectiveDate}
          </p>

          <div className="space-y-10 text-charcoal-300 leading-relaxed text-[15px]">
            <section>
              <p>
                본 규정은 「전자상거래 등에서의 소비자보호에 관한 법률」(이하
                &lsquo;전자상거래법&rsquo;) 및 관련 법령에 따른 {BUSINESS.serviceName}의
                청약철회·환불·교환에 관한 기준을 정합니다. {BUSINESS.serviceName}에서
                판매되는 상품은 주문 후 제조되는 수제 디저트로, 식품 특성상 아래
                규정이 적용됩니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제1조 청약철회 기간
              </h2>
              <p className="mb-2">
                소비자는 전자상거래법 제17조에 따라 아래 기간 내에 청약철회를
                요청할 수 있습니다.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <span className="font-medium">계약 내용서 수령일</span>로부터
                  7일 이내 (상품이 이보다 늦게 공급된 경우 상품 수령일로부터
                  7일 이내)
                </li>
                <li>
                  단, 제2조의 청약철회 제한 사유에 해당하는 경우 철회가
                  제한됩니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제2조 청약철회의 제한 (식품 특성 고지)
              </h2>
              <div className="bg-warm-200/40 p-4 rounded-lg mb-3">
                <p className="text-sm text-charcoal-400">
                  <span className="font-semibold">중요 안내:</span> 본 상품은
                  주문 후 제조되는 수제 식품으로, 전자상거래법 제17조 제2항 및
                  동법 시행령 제21조에 따라 아래의 경우 청약철회가 제한될 수
                  있습니다. 주문 전 반드시 확인해주세요.
                </p>
              </div>
              <p className="mb-2">
                다음의 경우 청약철회가 제한됩니다.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  소비자의 책임 있는 사유로 상품이 멸실되거나 훼손된 경우
                  (포장 개봉 후 단순 변심 포함)
                </li>
                <li>
                  소비자의 사용 또는 일부 소비로 상품 가치가 현저히 감소한 경우
                </li>
                <li>
                  시간의 경과에 따라 재판매가 곤란할 정도로 상품 가치가 현저히
                  감소한 경우 (식품 특성상 수령 후 시간 경과분 포함)
                </li>
                <li>
                  주문에 따라 개별적으로 제조되는 상품의 경우, 제조에 착수한
                  이후 (단, 제3조의 취소 가능 기간 내에는 철회 가능)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제3조 주문 취소 및 환불 기준
              </h2>
              <p className="mb-3">
                수제 디저트의 제조 일정을 고려하여 아래 기준에 따라 주문 취소
                및 환불을 처리합니다.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-charcoal-100/30">
                  <thead className="bg-warm-200/40">
                    <tr>
                      <th className="border border-charcoal-100/30 px-3 py-2 text-left">
                        취소 요청 시점
                      </th>
                      <th className="border border-charcoal-100/30 px-3 py-2 text-left">
                        환불 범위
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        픽업·배송 예정일 <span className="font-semibold">3일 전까지</span>
                      </td>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        전액 환불 (결제 수수료 제외)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        픽업·배송 예정일 <span className="font-semibold">2일 전부터</span>
                        <br />
                        (재료 준비·제조 착수)
                      </td>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        이미 투입된 재료비·제조비 차감 후 환불 가능
                        <br />
                        (구체적 금액은 문의 시 안내)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        픽업·배송 <span className="font-semibold">당일 및 수령 후</span>
                      </td>
                      <td className="border border-charcoal-100/30 px-3 py-2">
                        원칙적으로 환불 불가
                        <br />
                        (제4조 하자·변질 사유 제외)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm">
                ※ 최소 주문 기한(픽업 2일 전)은 재료 준비 및 제조 일정에 따라
                변경될 수 있으며, 상품 상세 페이지에서 확인하실 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제4조 상품 하자·변질 시 처리
              </h2>
              <p className="mb-2">
                아래의 경우 소비자는 수령일로부터 <span className="font-semibold">3일 이내</span>에
                하자 사실을 통지하여야 하며, 회사는 확인 후 재제작 또는 환불 등
                조치를 진행합니다.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>주문 내용과 다른 상품이 배송된 경우</li>
                <li>상품에 명백한 제조상 하자가 있는 경우</li>
                <li>수령 시점에 이미 변질되어 있는 경우</li>
              </ul>
              <p className="mt-2 text-sm">
                ※ 통지 시 상품 사진 및 상태 확인이 필요하며, 카카오톡 채널 또는
                대표 전화로 접수해주세요. 하자 상품은 당사 부담으로 회수하며,
                정상 상품으로 재제작하여 재발송하거나 전액 환불 처리합니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제5조 배송 중 파손·분실
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  택배 배송 중 파손·분실이 발생한 경우, 수령일로부터 3일 이내에
                  통지해주시면 택배사 배상 절차 및 재제작을 안내드립니다.
                </li>
                <li>
                  수령 후 보관 과정에서 발생한 변질·파손은 배상 대상에서
                  제외됩니다. 수령 즉시 냉장 보관을 권장합니다.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제6조 환불 절차 및 기간
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  환불 신청은 카카오톡 채널 또는 대표 전화로 접수 가능합니다.
                </li>
                <li>
                  회사는 환불 사유 확인 후 <span className="font-medium">3영업일 이내</span>
                  환불 처리를 개시합니다.
                </li>
                <li>
                  카드 결제 환불은 카드사 정책에 따라 <span className="font-medium">3~7영업일</span>
                  가량 소요될 수 있습니다.
                </li>
                <li>
                  사용된 포인트·쿠폰은 환불과 함께 원상 복구되며, 적립 예정이었던
                  포인트는 지급이 취소됩니다.
                </li>
                <li>
                  배송비는 환불 사유에 따라 부담 주체가 달라집니다. (소비자 단순
                  변심은 소비자 부담, 하자·오배송은 당사 부담)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제7조 교환
              </h2>
              <p>
                수제 디저트 특성상 동일 상품 교환은 원칙적으로 진행하지 않으며,
                하자·오배송 등의 사유에 해당하는 경우 재제작 후 재발송하거나
                환불 처리합니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제8조 분쟁 해결
              </h2>
              <p className="mb-2">
                본 규정과 관련하여 회사와 소비자 간에 발생한 분쟁은 상호 협의를
                통해 해결함을 원칙으로 하며, 협의가 이루어지지 않은 경우 아래
                기관을 통한 조정·상담이 가능합니다.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>한국소비자원 (www.kca.go.kr / 1372)</li>
                <li>전자거래분쟁조정위원회 (www.ecmc.or.kr / 1833-5172)</li>
                <li>공정거래위원회 (www.ftc.go.kr / 1355)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제9조 문의처
              </h2>
              <div className="bg-warm-200/30 p-4 rounded-lg space-y-1">
                <p>
                  <span className="font-medium">상호:</span>{" "}
                  {BUSINESS.companyName} ({BUSINESS.serviceName})
                </p>
                <p>
                  <span className="font-medium">대표 전화:</span>{" "}
                  <a
                    href={`tel:${BUSINESS.phone}`}
                    className="text-sage-400 hover:underline"
                  >
                    {BUSINESS.phone}
                  </a>
                </p>
                <p>
                  <span className="font-medium">카카오톡 채널:</span>{" "}
                  <a
                    href={BUSINESS.kakaoChannel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sage-400 underline hover:text-sage-500"
                  >
                    넉넉 디저트 채널 바로가기
                  </a>
                </p>
              </div>
              <p className="mt-2 text-sm">
                취소·환불 요청은 주문번호와 함께 위 연락처로 남겨주시면 빠르게
                확인 후 안내드립니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal-400 mb-3">
                제10조 규정의 변경
              </h2>
              <p>
                본 규정은 법령·정책 또는 서비스 운영 방침의 변경에 따라 내용이
                추가·삭제 및 수정될 수 있으며, 변경 시 웹사이트를 통해 공지합니다.
                변경 이전에 접수된 주문은 기존 규정을 따릅니다.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
