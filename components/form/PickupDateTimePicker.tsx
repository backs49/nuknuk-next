"use client";

import { useMemo, useState, useEffect, useRef } from "react";

interface ClosureEntry {
  startDate: string;
  endDate: string;
  reason: string | null;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  minLeadDays?: number;
  startHour?: number;
  endHour?: number;
  stepMinutes?: number;
  closedWeekdays?: number[];
  closedDates?: string[];
  closures?: ClosureEntry[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toIsoLocal(date: Date, hour: number, minute: number): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}T${pad2(hour)}:${pad2(minute)}`;
}

function parseIsoLocal(v: string): { date: Date | null; hour: number | null; minute: number | null } {
  if (!v) return { date: null, hour: null, minute: null };
  const match = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return { date: null, hour: null, minute: null };
  const [, y, m, d, h, min] = match;
  return {
    date: new Date(Number(y), Number(m) - 1, Number(d)),
    hour: Number(h),
    minute: Number(min),
  };
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function PickupDateTimePicker({
  value,
  onChange,
  minLeadDays = 2,
  startHour = 10,
  endHour = 16,
  stepMinutes = 60,
  closedWeekdays,
  closedDates,
  closures,
}: Props) {
  const parsed = useMemo(() => parseIsoLocal(value), [value]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(parsed.date);
  const [selectedHour, setSelectedHour] = useState<number | null>(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(parsed.minute);

  const initialMonth = parsed.date ?? addDays(new Date(), minLeadDays);
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());
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

  const minDate = useMemo(() => startOfDay(addDays(new Date(), minLeadDays)), [minLeadDays]);

  const closedWeekdaySet = useMemo(
    () => new Set(closedWeekdays ?? []),
    [closedWeekdays]
  );
  const adhocReasonByDate = useMemo(() => {
    const map = new Map<string, string | null>();
    const list = closures ?? [];
    for (const c of list) {
      const start = new Date(`${c.startDate}T00:00:00`);
      const end = new Date(`${c.endDate}T00:00:00`);
      const cur = new Date(start);
      while (cur <= end) {
        const iso = `${cur.getFullYear()}-${pad2(cur.getMonth() + 1)}-${pad2(cur.getDate())}`;
        map.set(iso, c.reason);
        cur.setDate(cur.getDate() + 1);
      }
    }
    if (map.size === 0) {
      for (const iso of closedDates ?? []) map.set(iso, null);
    }
    return map;
  }, [closures, closedDates]);

  const calendarCells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const firstWeekday = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{
      date: Date;
      disabled: boolean;
      regularClosed: boolean;
      adhocClosed: boolean;
    } | null> = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const iso = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
      const isPast = date < minDate;
      const adhoc = adhocReasonByDate.has(iso);
      const regular = closedWeekdaySet.has(date.getDay());
      const isClosed = adhoc || regular;
      cells.push({
        date,
        disabled: isPast || isClosed,
        regularClosed: regular,
        adhocClosed: adhoc,
      });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth, minDate, closedWeekdaySet, adhocReasonByDate]);

  const upcomingAdhoc = useMemo(() => {
    const list = closures ?? [];
    const today = startOfDay(new Date());
    return list
      .filter((c) => new Date(`${c.endDate}T00:00:00`) >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [closures]);

  const timeSlots = useMemo(() => {
    const slots: Array<{ hour: number; minute: number }> = [];
    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += stepMinutes) {
        if (h === endHour && m > 0) break;
        slots.push({ hour: h, minute: m });
      }
    }
    return slots;
  }, [startHour, endHour, stepMinutes]);

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

  function pickDate(date: Date) {
    setSelectedDate(date);
    if (selectedHour !== null && selectedMinute !== null) {
      onChange(toIsoLocal(date, selectedHour, selectedMinute));
    }
  }

  function pickTime(hour: number, minute: number) {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    if (selectedDate) {
      onChange(toIsoLocal(selectedDate, hour, minute));
    }
  }

  const displayLabel = (() => {
    if (!selectedDate || selectedHour === null || selectedMinute === null) {
      return "날짜와 시간을 선택해주세요";
    }
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth() + 1;
    const d = selectedDate.getDate();
    const w = WEEKDAYS[selectedDate.getDay()];
    return `${y}년 ${m}월 ${d}일 (${w}) · ${pad2(selectedHour)}:${pad2(selectedMinute)}`;
  })();

  const hasValue = Boolean(selectedDate && selectedHour !== null && selectedMinute !== null);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-left text-sm transition ${
          hasValue
            ? "border-sage-300 bg-sage-400/5 text-charcoal-400"
            : "border-gray-200 bg-white text-charcoal-200 hover:border-warm-300"
        }`}
      >
        <span className={hasValue ? "font-medium" : ""}>{displayLabel}</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-charcoal-200"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full md:w-[360px] bg-white border border-warm-100 rounded-2xl shadow-lg p-4">
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
            {calendarCells.map((cell, idx) => {
              if (!cell) return <div key={idx} />;
              const isSelected = selectedDate && sameDay(selectedDate, cell.date);
              const weekday = cell.date.getDay();
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={cell.disabled}
                  onClick={() => pickDate(cell.date)}
                  title={
                    cell.adhocClosed
                      ? `임시 휴무${
                          (() => {
                            const iso = `${cell.date.getFullYear()}-${pad2(cell.date.getMonth() + 1)}-${pad2(cell.date.getDate())}`;
                            const reason = adhocReasonByDate.get(iso);
                            return reason ? `: ${reason}` : "";
                          })()
                        }`
                      : cell.regularClosed
                      ? "정기 휴무"
                      : undefined
                  }
                  className={`relative aspect-square text-sm rounded-lg transition ${
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
                  {cell.adhocClosed ? (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
                  ) : cell.regularClosed ? (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-charcoal-100/60" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {(closedWeekdaySet.size > 0 || upcomingAdhoc.length > 0) && (
            <div className="mt-3 pt-3 border-t border-warm-100 space-y-2">
              {closedWeekdaySet.size > 0 && (
                <div>
                  <p className="text-xs font-semibold text-charcoal-300 mb-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-charcoal-100/60 mr-1 align-middle" />
                    정기 휴무
                  </p>
                  <p className="text-[11px] text-charcoal-300 leading-snug">
                    매주 {Array.from(closedWeekdaySet)
                      .sort((a, b) => a - b)
                      .map((n) => WEEKDAYS[n] + "요일")
                      .join(", ")}
                  </p>
                </div>
              )}
              {upcomingAdhoc.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-charcoal-300 mb-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-1 align-middle" />
                    임시 휴무 안내
                  </p>
                  <ul className="space-y-0.5">
                    {upcomingAdhoc.map((c, i) => (
                      <li key={i} className="text-[11px] text-charcoal-300 leading-snug">
                        {c.startDate === c.endDate
                          ? c.startDate
                          : `${c.startDate} ~ ${c.endDate}`}
                        {c.reason && <span className="text-charcoal-200"> · {c.reason}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-warm-100">
            <p className="text-xs font-semibold text-charcoal-300 mb-2">픽업 시간</p>
            <div className="grid grid-cols-4 gap-1.5">
              {timeSlots.map((slot) => {
                const isSelected =
                  selectedHour === slot.hour && selectedMinute === slot.minute;
                return (
                  <button
                    key={`${slot.hour}-${slot.minute}`}
                    type="button"
                    onClick={() => pickTime(slot.hour, slot.minute)}
                    className={`py-2 text-xs rounded-lg transition ${
                      isSelected
                        ? "bg-sage-400 text-white font-semibold shadow-sm shadow-sage-200/50"
                        : "bg-warm-100/40 text-charcoal-400 hover:bg-warm-100"
                    }`}
                  >
                    {pad2(slot.hour)}:{pad2(slot.minute)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={!hasValue}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                hasValue
                  ? "bg-sage-400 text-white hover:bg-sage-500"
                  : "bg-warm-100 text-charcoal-200 cursor-not-allowed"
              }`}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
