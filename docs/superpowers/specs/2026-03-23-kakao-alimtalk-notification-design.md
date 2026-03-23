# 카카오 알림톡 결제 완료 알림 설계

## 목표

결제 완료 시 고객의 전화번호로 "넉넉할유" 카카오톡 채널에서 알림톡을 발송한다.
솔라피(Solapi) API를 사용하며, 환경변수로 발송 on/off를 제어한다.

## 범위

- 결제 완료 시점에 알림톡 1건 발송 (수령방식에 따라 템플릿 분기)
- 환경변수 `KAKAO_ALIMTALK_ENABLED=true`일 때만 발송
- 기존 Discord/Email 알림은 변경 없음

## 환경변수

| 변수 | 용도 | 기본값 |
|---|---|---|
| `KAKAO_ALIMTALK_ENABLED` | 알림톡 발송 여부 | `false` |
| `SOLAPI_API_KEY` | 솔라피 API Key | (없음) |
| `SOLAPI_API_SECRET` | 솔라피 API Secret | (없음) |
| `SOLAPI_PFID` | 카카오 채널 연동 ID | (없음) |
| `SOLAPI_SENDER_PHONE` | 발신번호 (솔라피에 등록된 사업자 번호) | (없음) |
| `SOLAPI_TEMPLATE_ID_PICKUP` | 픽업 알림톡 템플릿 ID | (없음) |
| `SOLAPI_TEMPLATE_ID_SHIPPING` | 택배 알림톡 템플릿 ID | (없음) |

## 알림톡 메시지 템플릿

카카오 비즈센터에 등록할 템플릿. `#{변수명}`은 카카오 템플릿 등록 시 사용하는 문법이다.

### 픽업 (매장 수령)

```
[넉넉할유] 결제가 완료되었습니다.

주문번호: #{orderNumber}
주문상품: #{orderName}
결제금액: #{totalAmount}원
수령방식: 매장 픽업
수령일시: #{pickupDate}

문의: 카카오톡 채널 "넉넉할유"
```

### 택배 배송

```
[넉넉할유] 결제가 완료되었습니다.

주문번호: #{orderNumber}
주문상품: #{orderName}
결제금액: #{totalAmount}원
수령방식: 택배 배송
배송지: #{deliveryAddress}

문의: 카카오톡 채널 "넉넉할유"
```

## 아키텍처

### 신규 파일

**`lib/kakao-notification.ts`**

알림톡 발송 함수. 단일 책임: Order 객체를 받아 솔라피 API로 알림톡을 발송한다.

**공개 함수:**

```typescript
export async function sendKakaoAlimtalk(order: Order): Promise<void>
```

**동작:**
1. `KAKAO_ALIMTALK_ENABLED !== 'true'` → `console.log("카카오 알림톡 비활성화")` 후 return
2. 필수 환경변수 확인 (`SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_PFID`, `SOLAPI_SENDER_PHONE`) 누락 시 → `console.warn` 후 return
3. `order.deliveryMethod`에 따라 템플릿 ID 결정:
   - `"pickup"` → `SOLAPI_TEMPLATE_ID_PICKUP`
   - `"shipping"` → `SOLAPI_TEMPLATE_ID_SHIPPING`
   - 해당 템플릿 ID 환경변수가 미설정이면 → `console.warn` 후 return
4. 전화번호 정규화: `order.customerPhone`에서 숫자가 아닌 문자를 모두 제거. `82`로 시작하면 `0`으로 교체 (국제번호 처리)
5. 주문상품명 생성: 아이템 1개면 이름 그대로, 2개 이상이면 `"첫번째상품 외 N건"`
6. 템플릿 변수 구성 (런타임 API에서는 `#{}` 래퍼 없이 키 이름만 사용):
   - 공통: `orderNumber`, `orderName`, `totalAmount`
   - 픽업: `pickupDate`
   - 택배: `deliveryAddress`
7. 솔라피 `POST https://api.solapi.com/messages/v4/send` 호출
   - 인증: HMAC-SHA256 서명 (Node.js `crypto` 모듈)
   - `from`: `SOLAPI_SENDER_PHONE` 환경변수
   - Body: `{ message: { to, from, type: "ATA", kakaoOptions: { pfId, templateId, variables } } }`
8. 발송 실패 시 `console.error`만 남김 (throw 안 함, 결제 응답에 영향 없음)

### 수정 파일

**`app/api/payments/confirm/route.ts`**

결제 확인 성공 후 알림 발송 부분(line 112-115)에 1줄 추가:

```typescript
// 기존
sendDiscordNotification(orderName, amount).catch(console.error);
sendEmailNotification(orderName, amount).catch(console.error);

// 추가
if (order) {
  sendKakaoAlimtalk(order).catch(console.error);
}
```

`order` 객체는 line 68에서 `getOrderByNumber(orderId)`로 이미 조회되어 있음.

참고: Supabase 미설정 시 `getOrderByNumber`가 throw하므로 결제 확인 핸들러 자체가 catch 블록으로 빠짐. 따라서 `order`가 존재하는 시점에서는 항상 유효한 Order 객체이다. `if (order)` 가드는 타입 안전성을 위한 것이다.

## 솔라피 API 인증

솔라피는 HMAC-SHA256 서명 방식을 사용한다:

```
Authorization: HMAC-SHA256 apiKey={API_KEY}, date={ISO8601}, salt={random}, signature={HMAC}
```

- `salt`: 랜덤 문자열 (`crypto.randomUUID()`)
- `date`: ISO 8601 형식
- `signature`: HMAC-SHA256(`date + salt`, API_SECRET)

외부 SDK 없이 Node.js `crypto`로 직접 구현한다 (의존성 최소화).

## 솔라피 메시지 발송 API

```
POST https://api.solapi.com/messages/v4/send
Content-Type: application/json

{
  "message": {
    "to": "01012345678",
    "from": "0541234567",
    "type": "ATA",
    "kakaoOptions": {
      "pfId": "KA01PF...",
      "templateId": "KA01TP...",
      "variables": {
        "orderNumber": "NUK-20260323-001",
        "orderName": "쑥 송편 외 1건",
        "totalAmount": "282,000",
        "pickupDate": "2026-03-25 14:00"
      }
    }
  }
}
```

참고: `variables`의 키는 카카오 템플릿에 등록된 변수명과 동일하되, 런타임 API에서는 `#{}` 래퍼 없이 키 이름만 사용한다.

## 전화번호 정규화

`sendKakaoAlimtalk` 내부에서 수신자 전화번호를 정규화한다:

```typescript
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");       // 숫자만 추출
  if (digits.startsWith("82")) return "0" + digits.slice(2); // +82 → 0
  return digits;
}
```

예시:
- `"010-1234-5678"` → `"01012345678"`
- `"+821012345678"` → `"01012345678"`
- `"01012345678"` → `"01012345678"` (변경 없음)

## 에러 처리

- `KAKAO_ALIMTALK_ENABLED !== 'true'` → 로그 후 skip
- 필수 환경변수 미설정 → 경고 로그 후 skip (서비스 중단 없음)
- 해당 수령방식의 템플릿 ID 미설정 → 경고 로그 후 skip
- 솔라피 API 오류 → `console.error` 후 무시 (기존 Discord/Email과 동일 패턴)
- `order`가 falsy → 호출 자체를 하지 않음 (confirm route에서 `if (order)` 가드)

## 선행 작업 (코드 외)

솔라피 가입 후 아래 절차를 진행해야 알림톡이 실제 발송된다:

1. 솔라피 회원가입 + 사업자 인증
2. 발신번호 등록 (사업자 대표번호 또는 가게 전화번호)
3. 카카오 비즈니스 채널 "넉넉할유" 연동
4. 알림톡 템플릿 2종 등록 (픽업/택배) → 카카오 검수 (1-2영업일)
5. 환경변수에 발급받은 키/ID 설정
6. `KAKAO_ALIMTALK_ENABLED=true`로 활성화
