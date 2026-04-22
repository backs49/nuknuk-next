"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minDate?: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseIso(v: string): Date | null {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "날짜 선택",
  minDate,
}: Props) {
  const selected = useMemo(() => parseIso(value), [value]);
  const initial = selected ?? new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const minDateObj = useMemo(() => (minDate ? parseIso(minDate) : null), [minDate]);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const firstWeekday = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const result: Array<{ date: Date; disabled: boolean } | null> = [];
    for (let i = 0; i < firstWeekday; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      result.push({ date, disabled: minDateObj ? date < minDateObj : false });
    }
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [viewYear, viewMonth, minDateObj]);

  function goMonth(delta: number) {
    let y = viewYear;
    let m = viewMonth + delta;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  }

  function pick(d: Date) {
    onChange(toIso(d));
    setOpen(false);
  }

  const label = (() => {
    if (!selected) return placeholder;
    const y = selected.getFullYear();
    const m = selected.getMonth() + 1;
    const d = selected.getDate();
    const w = WEEKDAYS[selected.getDay()];
    return `${y}년 ${m}월 ${d}일 (${w})`;
  })();

  const hasValue = Boolean(selected);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-left text-sm transition ${
          hasValue
            ? "border-sage-300 bg-sage-400/5 text-charcoal-400"
            : "border-gray-200 bg-white text-charcoal-200 hover:border-warm-300"
        }`}
      >
        <span className={hasValue ? "font-medium" : ""}>{label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-charcoal-200 shrink-0"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full md:w-[320px] bg-white border border-warm-100 rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-warm-100/60 text-charcoal-300"
              aria-label="이전 달"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <p className="text-sm font-display font-semibold text-charcoal-400">
              {viewYear}년 {viewMonth + 1}월
            </p>
            <button
              type="button"
              onClick={() => goMonth(1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-warm-100/60 text-charcoal-300"
              aria-label="다음 달"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={`text-center text-xs py-1 ${
                  i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-charcoal-200"
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell) return <div key={idx} />;
              const isSelected = selected && sameDay(selected, cell.date);
              const weekday = cell.date.getDay();
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={cell.disabled}
                  onClick={() => pick(cell.date)}
                  className={`aspect-square text-sm rounded-lg transition ${
                    isSelected
                      ? "bg-sage-400 text-white font-semibold shadow-sm shadow-sage-200/50"
                      : cell.disabled
                      ? "text-charcoal-100/50 cursor-not-allowed"
                      : weekday === 0
                      ? "text-red-400 hover:bg-warm-100/60"
                      : weekday === 6
                      ? "text-blue-400 hover:bg-warm-100/60"
                      : "text-charcoal-400 hover:bg-warm-100/60"
                  }`}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          {hasValue && (
            <div className="mt-3 pt-3 border-t border-warm-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs text-charcoal-200 hover:text-charcoal-400"
              >
                선택 해제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
