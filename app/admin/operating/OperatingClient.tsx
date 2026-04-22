"use client";

import { useEffect, useState } from "react";

interface Closure {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
}

interface OperatingState {
  openHour: number;
  closeHour: number;
  slotMinutes: number;
  closedWeekdays: number[];
  closedDates: string[];
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function OperatingClient() {
  const [loading, setLoading] = useState(true);
  const [openHour, setOpenHour] = useState(10);
  const [closeHour, setCloseHour] = useState(16);
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set([1]));
  const [closures, setClosures] = useState<Closure[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [opRes, clRes] = await Promise.all([
        fetch("/api/shop/operating"),
        fetch("/api/admin/operating/closures"),
      ]);
      const op: OperatingState = await opRes.json();
      const cl = await clRes.json();
      setOpenHour(op.openHour);
      setCloseHour(op.closeHour);
      setSlotMinutes(op.slotMinutes);
      setWeekdays(new Set(op.closedWeekdays));
      setClosures(cl.closures ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function toggleWeekday(n: number) {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  async function saveHours() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/operating/hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openHour, closeHour, slotMinutes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "저장 실패");
      }
      setMessage("영업시간 저장 완료");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function saveWeekdays() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/operating/weekdays", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekdays: Array.from(weekdays) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "저장 실패");
      }
      setMessage("정기 휴무 저장 완료");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function addClosure() {
    if (!startDate) {
      setMessage("시작일을 입력해주세요");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/operating/closures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate: endDate || startDate,
          reason: reason || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "등록 실패");
      }
      setStartDate("");
      setEndDate("");
      setReason("");
      await loadAll();
      setMessage("휴무 등록 완료");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "등록 실패");
    } finally {
      setSaving(false);
    }
  }

  async function removeClosure(id: string) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/operating/closures/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "삭제 실패");
      }
      await loadAll();
      setMessage("휴무 삭제 완료");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-charcoal-200">로딩 중...</p>;
  }

  const today = todayIso();
  const upcoming = closures.filter((c) => c.endDate >= today);
  const past = closures.filter((c) => c.endDate < today);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-charcoal-400">운영 / 휴무 관리</h1>
        <p className="text-sm text-charcoal-200 mt-1">
          영업시간과 정기/임시 휴무를 관리합니다. 픽업 가능 시간대와 달력에 즉시 반영됩니다(최대 5분).
        </p>
      </div>

      {message && (
        <div className="px-4 py-2 bg-sage-400/10 border border-sage-300 rounded-lg text-sm text-charcoal-400">
          {message}
        </div>
      )}

      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-charcoal-400">영업시간</h2>
        <div className="flex gap-4 items-end flex-wrap">
          <label className="text-sm">
            <span className="block mb-1 text-charcoal-300">시작</span>
            <select
              value={openHour}
              onChange={(e) => setOpenHour(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                <option key={h} value={h}>
                  {h}시
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-charcoal-300">종료</span>
            <select
              value={closeHour}
              onChange={(e) => setCloseHour(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {h}시
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-charcoal-300">슬롯 간격</span>
            <select
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {[15, 30, 60].map((m) => (
                <option key={m} value={m}>
                  {m}분
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={saveHours}
            disabled={saving}
            className="px-4 py-2 bg-sage-400 text-white rounded-lg text-sm font-medium hover:bg-sage-500 disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-charcoal-400">정기 휴무 요일</h2>
        <div className="flex gap-2 flex-wrap">
          {WEEKDAY_LABELS.map((lbl, i) => (
            <label
              key={i}
              className={`px-3 py-2 border rounded-lg text-sm cursor-pointer transition ${
                weekdays.has(i)
                  ? "border-sage-400 bg-sage-400/10 text-charcoal-400 font-medium"
                  : "border-gray-200 text-charcoal-200"
              }`}
            >
              <input
                type="checkbox"
                checked={weekdays.has(i)}
                onChange={() => toggleWeekday(i)}
                className="sr-only"
              />
              {lbl}
            </label>
          ))}
        </div>
        <button
          onClick={saveWeekdays}
          disabled={saving}
          className="px-4 py-2 bg-sage-400 text-white rounded-lg text-sm font-medium hover:bg-sage-500 disabled:opacity-50"
        >
          저장
        </button>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-charcoal-400">임시 휴무 추가</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block mb-1 text-charcoal-300">시작일 *</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1 text-charcoal-300">종료일 (비우면 당일)</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </label>
        </div>
        <label className="text-sm block">
          <span className="block mb-1 text-charcoal-300">사유 (선택)</span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예: 어린이날 연휴"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </label>
        <button
          onClick={addClosure}
          disabled={saving || !startDate}
          className="px-4 py-2 bg-sage-400 text-white rounded-lg text-sm font-medium hover:bg-sage-500 disabled:opacity-50"
        >
          등록
        </button>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
        <h2 className="font-bold text-charcoal-400">예정된 휴무</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-charcoal-200">예정된 임시 휴무가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-warm-100">
            {upcoming.map((c) => (
              <li key={c.id} className="py-2 flex items-center justify-between">
                <div className="text-sm text-charcoal-400">
                  {c.startDate === c.endDate
                    ? c.startDate
                    : `${c.startDate} ~ ${c.endDate}`}
                  {c.reason && (
                    <span className="ml-2 text-charcoal-200">· {c.reason}</span>
                  )}
                </div>
                <button
                  onClick={() => removeClosure(c.id)}
                  className="text-xs text-red-400 hover:text-red-500"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => setShowPast((v) => !v)}
          className="text-xs text-charcoal-200 underline"
        >
          지난 휴무 {showPast ? "접기" : "펼치기"} ({past.length})
        </button>
        {showPast && past.length > 0 && (
          <ul className="divide-y divide-warm-100 opacity-70">
            {past.map((c) => (
              <li key={c.id} className="py-2 flex items-center justify-between">
                <div className="text-sm text-charcoal-400">
                  {c.startDate === c.endDate
                    ? c.startDate
                    : `${c.startDate} ~ ${c.endDate}`}
                  {c.reason && (
                    <span className="ml-2 text-charcoal-200">· {c.reason}</span>
                  )}
                </div>
                <button
                  onClick={() => removeClosure(c.id)}
                  className="text-xs text-red-400 hover:text-red-500"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
