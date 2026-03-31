"use client";

import { useState } from "react";
import type { Review } from "@/lib/review-db";

interface ReviewFormProps {
  menuItemId: string;
  menuItemName: string;
  pointEnabled: boolean;
  onSubmitted: (review: Review) => void;
  onCancel: () => void;
}

type Step = "verify" | "select" | "write";

interface VerifiedItem {
  menuItemId: string;
  menuItemName: string;
  hasReview: boolean;
}

export default function ReviewForm({
  menuItemId,
  menuItemName,
  pointEnabled,
  onSubmitted,
  onCancel,
}: ReviewFormProps) {
  const [step, setStep] = useState<Step>("verify");
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // 검증 결과
  const [orderId, setOrderId] = useState("");
  const [items, setItems] = useState<VerifiedItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState(menuItemId);
  const [selectedItemName, setSelectedItemName] = useState(menuItemName);

  // 리뷰 작성
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Step 1: 주문 검증
  const handleVerify = async () => {
    setVerifyError("");
    setVerifying(true);
    try {
      const res = await fetch("/api/reviews/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!data.verified) {
        setVerifyError(data.message || "검증에 실패했습니다");
        return;
      }
      setOrderId(data.orderId);
      setItems(data.items);

      // 현재 상품이 리뷰 가능한지 확인
      const currentItem = data.items.find(
        (i: VerifiedItem) => i.menuItemId === menuItemId && !i.hasReview
      );
      if (currentItem) {
        setSelectedItemId(currentItem.menuItemId);
        setSelectedItemName(currentItem.menuItemName);
        setStep("write");
      } else {
        // 다른 상품 선택 필요
        setStep("select");
      }
    } catch {
      setVerifyError("서버 오류가 발생했습니다");
    } finally {
      setVerifying(false);
    }
  };

  // Step 2: 상품 선택
  const handleSelectItem = (item: VerifiedItem) => {
    if (item.hasReview) return;
    setSelectedItemId(item.menuItemId);
    setSelectedItemName(item.menuItemName);
    setStep("write");
  };

  // 사진 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (imageUrls.length + files.length > 3) {
      alert("사진은 최대 3장까지 첨부할 수 있습니다");
      return;
    }

    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/reviews/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          setImageUrls((prev) => [...prev, data.url]);
        }
      } catch {
        // 개별 업로드 실패 무시
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  // Step 3: 리뷰 제출
  const handleSubmit = async () => {
    if (rating === 0) {
      setSubmitError("별점을 선택해주세요");
      return;
    }
    if (content.length < 10) {
      setSubmitError("리뷰는 10자 이상 작성해주세요");
      return;
    }
    setSubmitError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          menuItemId: selectedItemId,
          phone: phone.trim(),
          rating,
          content,
          imageUrls,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setSubmitError(data.error);
        return;
      }

      if (data.pointRewarded > 0) {
        alert(`리뷰가 등록되었습니다! ${data.pointRewarded}P가 적립되었습니다.`);
      } else {
        alert("리뷰가 등록되었습니다!");
      }
      onSubmitted(data.review);
    } catch {
      setSubmitError("서버 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      {/* Step 1: 인증 */}
      {step === "verify" && (
        <div>
          <h3 className="text-sm font-semibold text-charcoal-400 mb-3">리뷰 작성</h3>
          <p className="text-xs text-charcoal-200 mb-4">
            주문번호와 전화번호를 입력하여 본인 확인 후 리뷰를 작성할 수 있습니다.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="주문번호 (예: NUK-20260331-001)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50"
            />
            <input
              type="tel"
              placeholder="전화번호 (예: 010-1234-5678)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/50"
            />
          </div>
          {verifyError && (
            <p className="text-xs text-red-500 mt-2">{verifyError}</p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-200 text-charcoal-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleVerify}
              disabled={verifying || !orderNumber || !phone}
              className="flex-1 py-2.5 bg-sage-400 text-white rounded-lg text-sm font-medium hover:brightness-95 transition-colors disabled:opacity-50"
            >
              {verifying ? "확인 중..." : "확인"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 상품 선택 */}
      {step === "select" && (
        <div>
          <h3 className="text-sm font-semibold text-charcoal-400 mb-3">
            리뷰할 상품을 선택하세요
          </h3>
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.menuItemId}
                onClick={() => handleSelectItem(item)}
                disabled={item.hasReview}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  item.hasReview
                    ? "border-gray-100 text-charcoal-100 bg-gray-50 cursor-not-allowed"
                    : "border-gray-200 text-charcoal-400 hover:border-sage-400 hover:bg-sage-400/5"
                }`}
              >
                {item.menuItemName}
                {item.hasReview && (
                  <span className="ml-2 text-xs text-charcoal-100">(이미 작성됨)</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={onCancel}
            className="w-full mt-3 py-2.5 border border-gray-200 text-charcoal-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      )}

      {/* Step 3: 리뷰 작성 */}
      {step === "write" && (
        <div>
          <h3 className="text-sm font-semibold text-charcoal-400 mb-3">
            {selectedItemName} 리뷰 작성
          </h3>

          {/* 별점 선택 */}
          <div className="mb-4">
            <p className="text-xs text-charcoal-200 mb-2">별점을 선택하세요</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`text-2xl transition-colors ${
                    n <= rating ? "text-amber-400" : "text-gray-200"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* 텍스트 입력 */}
          <div className="mb-4">
            <textarea
              placeholder="리뷰를 작성해주세요 (10~500자)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sage-400/50"
            />
            <p className="text-xs text-charcoal-100 text-right mt-1">
              {content.length}/500
            </p>
          </div>

          {/* 사진 업로드 */}
          <div className="mb-4">
            <p className="text-xs text-charcoal-200 mb-2">
              사진 추가 (최대 3장)
            </p>
            <div className="flex gap-2 flex-wrap">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative w-16 h-16">
                  <img
                    src={url}
                    alt={`사진 ${i + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              {imageUrls.length < 3 && (
                <label className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-charcoal-200 cursor-pointer hover:border-sage-400 hover:text-sage-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {uploading ? "..." : "+"}
                </label>
              )}
            </div>
          </div>

          {/* 포인트 안내 */}
          {pointEnabled && (
            <p className="text-xs text-sage-400 mb-4">
              💡 사진 포함 시 500P, 텍스트만 300P 적립
            </p>
          )}

          {submitError && (
            <p className="text-xs text-red-500 mb-3">{submitError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-200 text-charcoal-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 bg-sage-400 text-white rounded-lg text-sm font-medium hover:brightness-95 transition-colors disabled:opacity-50"
            >
              {submitting ? "등록 중..." : "리뷰 등록"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
