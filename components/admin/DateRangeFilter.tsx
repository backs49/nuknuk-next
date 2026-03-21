"use client";

interface DateRangeFilterProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

type Preset = "today" | "thisWeek" | "thisMonth" | "lastMonth" | "custom";

function getPresetDates(preset: Exclude<Preset, "custom">): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === "today") {
    const today = fmt(now);
    return { from: today, to: today };
  }

  if (preset === "thisWeek") {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    return { from: fmt(monday), to: fmt(now) };
  }

  if (preset === "thisMonth") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: fmt(first), to: fmt(now) };
  }

  if (preset === "lastMonth") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: fmt(first), to: fmt(last) };
  }

  return { from: fmt(now), to: fmt(now) };
}

function detectPreset(from: string, to: string): Preset {
  const presets: Exclude<Preset, "custom">[] = ["today", "thisWeek", "thisMonth", "lastMonth"];
  for (const preset of presets) {
    const dates = getPresetDates(preset);
    if (dates.from === from && dates.to === to) return preset;
  }
  return "custom";
}

const PRESET_LABELS: Record<Exclude<Preset, "custom">, string> = {
  today: "오늘",
  thisWeek: "이번 주",
  thisMonth: "이번 달",
  lastMonth: "지난 달",
};

export default function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const activePreset = detectPreset(from, to);

  function handlePreset(preset: Exclude<Preset, "custom">) {
    const dates = getPresetDates(preset);
    onChange(dates.from, dates.to);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(Object.keys(PRESET_LABELS) as Exclude<Preset, "custom">[]).map((preset) => (
        <button
          key={preset}
          onClick={() => handlePreset(preset)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
            activePreset === preset
              ? "bg-sage-400 text-white border-sage-400"
              : "bg-white text-charcoal-300 border-gray-200 hover:border-sage-400 hover:text-sage-400"
          }`}
        >
          {PRESET_LABELS[preset]}
        </button>
      ))}

      <div className="flex items-center gap-1.5 ml-2">
        <input
          type="date"
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
          className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-charcoal-300 focus:outline-none focus:border-sage-400"
        />
        <span className="text-gray-400 text-sm">~</span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => onChange(from, e.target.value)}
          className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg text-charcoal-300 focus:outline-none focus:border-sage-400"
        />
      </div>
    </div>
  );
}
