// app/admin/reviews/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";

interface AdminReview {
  id: string;
  orderId: string;
  menuItemId: string;
  customerPhone: string;
  customerName: string;
  rating: number;
  content: string;
  imageUrls: string[];
  pointRewarded: number;
  adminReply: string | null;
  adminReplyAt: string | null;
  isVisible: boolean;
  createdAt: string;
  menuItemName?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"all" | "no_reply" | "hidden">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [editingReply, setEditingReply] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?filter=${filter}&page=${page}&limit=20`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
    } catch {
      // 무시
    }
    setLoading(false);
  }, [filter, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReply = async (reviewId: string) => {
    const reply = replyInputs[reviewId];
    if (!reply?.trim()) return;

    await fetch(`/api/admin/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminReply: reply }),
    });
    setEditingReply(null);
    fetchReviews();
  };

  const handleToggleVisibility = async (reviewId: string, isVisible: boolean) => {
    await fetch(`/api/admin/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible }),
    });
    fetchReviews();
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("리뷰를 삭제하시겠습니까? 지급된 포인트도 회수됩니다.")) return;

    await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
    fetchReviews();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-charcoal-400 mb-6">
        리뷰 관리
      </h1>

      {/* 필터 */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(
          [
            { key: "all", label: "전체" },
            { key: "no_reply", label: "답글 미작성" },
            { key: "hidden", label: "숨김 처리" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setFilter(key);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              filter === key
                ? "bg-sage-400 text-white"
                : "bg-gray-100 text-charcoal-300 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-charcoal-200 py-8 text-center">로딩 중...</p>
      ) : reviews.length === 0 ? (
        <p className="text-charcoal-200 py-8 text-center">리뷰가 없습니다</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-xl p-4 shadow-sm border ${
                !review.isVisible ? "border-red-200 bg-red-50/30" : "border-gray-100"
              }`}
            >
              {/* 헤더 */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-sm font-semibold text-charcoal-400">
                    {review.menuItemName}
                  </span>
                  <span className="text-xs text-charcoal-200 ml-2">
                    {review.customerName} ({review.customerPhone})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </span>
                  <span className="text-xs text-charcoal-100">
                    {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>

              {/* 내용 */}
              <p className="text-sm text-charcoal-300 mb-2">{review.content}</p>

              {/* 사진 */}
              {review.imageUrls.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {review.imageUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* 포인트 정보 */}
              {review.pointRewarded > 0 && (
                <p className="text-xs text-sage-400 mb-2">
                  적립 포인트: {review.pointRewarded}P
                </p>
              )}

              {/* 관리자 답글 */}
              {review.adminReply && editingReply !== review.id && (
                <div className="p-3 bg-gray-50 rounded-lg border-l-3 border-sage-400 mb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-sage-400">답글</span>
                    <button
                      onClick={() => {
                        setEditingReply(review.id);
                        setReplyInputs((p) => ({ ...p, [review.id]: review.adminReply || "" }));
                      }}
                      className="text-xs text-charcoal-200 hover:text-charcoal-400"
                    >
                      수정
                    </button>
                  </div>
                  <p className="text-sm text-charcoal-300 mt-1">{review.adminReply}</p>
                </div>
              )}

              {/* 답글 입력 */}
              {(editingReply === review.id || !review.adminReply) &&
                editingReply === review.id && (
                  <div className="mb-2">
                    <textarea
                      value={replyInputs[review.id] || ""}
                      onChange={(e) =>
                        setReplyInputs((p) => ({ ...p, [review.id]: e.target.value }))
                      }
                      placeholder="답글을 작성하세요"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sage-400/50"
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => setEditingReply(null)}
                        className="px-3 py-1 text-xs text-charcoal-300 hover:text-charcoal-400"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleReply(review.id)}
                        className="px-3 py-1 bg-sage-400 text-white text-xs rounded-lg"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                )}

              {/* 액션 버튼 */}
              <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                {!review.adminReply && editingReply !== review.id && (
                  <button
                    onClick={() => {
                      setEditingReply(review.id);
                      setReplyInputs((p) => ({ ...p, [review.id]: "" }));
                    }}
                    className="text-xs text-sage-400 hover:underline"
                  >
                    답글 작성
                  </button>
                )}
                <button
                  onClick={() => handleToggleVisibility(review.id, !review.isVisible)}
                  className="text-xs text-charcoal-200 hover:text-charcoal-400"
                >
                  {review.isVisible ? "숨김" : "노출"}
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm ${
                    page === p
                      ? "bg-sage-400 text-white"
                      : "bg-gray-100 text-charcoal-300 hover:bg-gray-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
