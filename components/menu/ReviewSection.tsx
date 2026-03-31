"use client";

import { useState } from "react";
import Image from "next/image";
import type { Review, ReviewSummary } from "@/lib/review-db";
import ReviewForm from "./ReviewForm";

interface ReviewSectionProps {
  menuItemId: string;
  menuItemName: string;
  initialReviews: Review[];
  summary: ReviewSummary;
  pointEnabled: boolean;
}

function maskName(name: string): string {
  if (!name || name.length <= 1) return name || "익명";
  return name[0] + "**";
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < rating ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs text-charcoal-200">
      <span className="w-5 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5">{count}</span>
    </div>
  );
}

export default function ReviewSection({
  menuItemId,
  menuItemName,
  initialReviews,
  summary,
  pointEnabled,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [hasMore, setHasMore] = useState(initialReviews.length >= 5 && summary.totalCount > 5);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reviews?menuItemId=${menuItemId}&offset=${reviews.length}&limit=5`
      );
      const data = await res.json();
      if (data.reviews && data.reviews.length > 0) {
        setReviews((prev) => [...prev, ...data.reviews]);
        if (data.reviews.length < 5) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch {
      // 무시
    }
    setLoading(false);
  };

  const handleReviewSubmitted = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
    setShowForm(false);
  };

  return (
    <div className="mt-2 bg-white px-4 py-5 lg:mt-8 lg:rounded-2xl lg:shadow-sm">
      <div className="max-w-lg mx-auto lg:max-w-3xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-charcoal-400">
            고객 리뷰{" "}
            <span className="text-sage-400 text-sm font-normal">
              {summary.totalCount}개
            </span>
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-sage-400 text-white text-sm font-medium rounded-lg hover:brightness-95 transition-colors"
          >
            리뷰 작성
          </button>
        </div>

        {/* 리뷰 작성 폼 */}
        {showForm && (
          <div className="mb-6">
            <ReviewForm
              menuItemId={menuItemId}
              menuItemName={menuItemName}
              pointEnabled={pointEnabled}
              onSubmitted={handleReviewSubmitted}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* 별점 요약 */}
        {summary.totalCount > 0 && (
          <div className="flex items-center gap-4 p-4 bg-[#F8FFF0] rounded-xl mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-charcoal-400">
                {summary.averageRating}
              </div>
              <StarRating rating={Math.round(summary.averageRating)} />
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((n) => (
                <RatingBar
                  key={n}
                  label={`${n}점`}
                  count={summary.distribution[n] || 0}
                  total={summary.totalCount}
                />
              ))}
            </div>
          </div>
        )}

        {/* 리뷰 목록 */}
        {reviews.length === 0 && !showForm ? (
          <p className="text-center text-charcoal-200 py-8">
            아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <div key={review.id} className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="text-sm font-semibold text-charcoal-400">
                      {maskName(review.customerName)}
                    </span>
                  </div>
                  <span className="text-xs text-charcoal-100">
                    {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <p className="text-sm text-charcoal-300 leading-relaxed mb-2">
                  {review.content}
                </p>
                {/* 사진 */}
                {review.imageUrls.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {review.imageUrls.map((url, i) => (
                      <div
                        key={i}
                        className="w-16 h-16 rounded-lg overflow-hidden relative"
                      >
                        <Image
                          src={url}
                          alt={`리뷰 사진 ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {/* 관리자 답글 */}
                {review.adminReply && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-3 border-sage-400">
                    <span className="text-xs font-semibold text-sage-400">
                      넉넉 디저트
                    </span>
                    <p className="text-sm text-charcoal-300 mt-1 leading-relaxed">
                      {review.adminReply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 더보기 */}
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full py-3 text-sm text-charcoal-200 hover:text-charcoal-400 transition-colors border-t border-gray-100"
          >
            {loading ? "로딩 중..." : "리뷰 더보기"}
          </button>
        )}
      </div>
    </div>
  );
}
