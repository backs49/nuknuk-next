"use client";

import { useState, useEffect } from "react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 추가/수정 폼
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchFAQs = async () => {
    try {
      const res = await fetch("/api/admin/faq");
      const data = await res.json();
      setFaqs(data.faqs || []);
    } catch {
      setError("FAQ 목록을 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormQuestion("");
    setFormAnswer("");
  };

  const handleSave = async () => {
    if (!formQuestion.trim() || !formAnswer.trim()) {
      setError("질문과 답변을 모두 입력해주세요");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/faq/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: formQuestion.trim(),
            answer: formAnswer.trim(),
          }),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/admin/faq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: formQuestion.trim(),
            answer: formAnswer.trim(),
          }),
        });
        if (!res.ok) throw new Error();
      }

      resetForm();
      await fetchFAQs();
    } catch {
      setError(editingId ? "수정에 실패했습니다" : "추가에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (faq: FAQItem) => {
    setEditingId(faq.id);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchFAQs();
    } catch {
      setError("삭제에 실패했습니다");
    }
  };

  const handleToggleActive = async (faq: FAQItem) => {
    try {
      const res = await fetch(`/api/admin/faq/${faq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !faq.isActive }),
      });
      if (!res.ok) throw new Error();
      await fetchFAQs();
    } catch {
      setError("상태 변경에 실패했습니다");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newFaqs = [...faqs];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newFaqs.length) return;

    [newFaqs[index], newFaqs[swapIndex]] = [newFaqs[swapIndex], newFaqs[index]];
    const orderedIds = newFaqs.map((f) => f.id);

    setFaqs(newFaqs);

    try {
      const res = await fetch("/api/admin/faq/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError("순서 변경에 실패했습니다");
      await fetchFAQs();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-charcoal-200">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-charcoal-400">FAQ 관리</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-sage-400 text-white rounded-lg text-sm font-medium hover:bg-sage-500 transition"
          >
            항목 추가
          </button>
        )}
      </div>
      <p className="text-sm text-charcoal-200 mb-8">
        자주 묻는 질문을 관리합니다. 고객 홈페이지에 표시됩니다.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">
            닫기
          </button>
        </div>
      )}

      {/* 추가/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold text-charcoal-400 mb-4">
            {editingId ? "FAQ 수정" : "FAQ 추가"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-1">
                질문
              </label>
              <input
                type="text"
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400"
                placeholder="예: 주문은 어떻게 하나요?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-300 mb-1">
                답변
              </label>
              <textarea
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 resize-none"
                placeholder="답변을 입력하세요"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-sage-400 text-white rounded-lg text-sm font-medium hover:bg-sage-500 transition disabled:opacity-50"
              >
                {saving ? "저장 중..." : editingId ? "수정" : "추가"}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-100 text-charcoal-300 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ 목록 */}
      {faqs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-charcoal-200">등록된 FAQ가 없습니다</p>
          <p className="text-xs text-charcoal-100 mt-1">
            &quot;항목 추가&quot; 버튼을 눌러 FAQ를 등록해보세요
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`bg-white rounded-xl p-5 shadow-sm transition ${
                !faq.isActive ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-charcoal-400 text-sm">
                    Q. {faq.question}
                  </h3>
                  <p className="text-sm text-charcoal-200 mt-1 whitespace-pre-wrap">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="w-7 h-7 flex items-center justify-center text-xs text-charcoal-200 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="위로"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMove(index, "down")}
                    disabled={index === faqs.length - 1}
                    className="w-7 h-7 flex items-center justify-center text-xs text-charcoal-200 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="아래로"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => handleToggleActive(faq)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      faq.isActive ? "bg-sage-400" : "bg-gray-200"
                    }`}
                    title={faq.isActive ? "비활성화" : "활성화"}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        faq.isActive ? "translate-x-4" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleEdit(faq)}
                    className="w-7 h-7 flex items-center justify-center text-xs text-charcoal-200 hover:bg-gray-100 rounded"
                    title="수정"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="w-7 h-7 flex items-center justify-center text-xs text-red-400 hover:bg-red-50 rounded"
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {!faq.isActive && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-charcoal-100 text-xs rounded">
                  비활성
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
