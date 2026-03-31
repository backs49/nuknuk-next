"use client";

import { useState, useEffect } from "react";

interface Setting {
  key: string;
  value: string;
  label: string;
  description: string | null;
  updatedAt: string;
}

// 설정별 표시 형식 및 입력 도우미
const SETTING_CONFIG: Record<
  string,
  { type: "percent" | "number"; suffix: string; placeholder: string }
> = {
  point_earn_rate: {
    type: "percent",
    suffix: "%",
    placeholder: "예: 3",
  },
  referral_reward_points: {
    type: "number",
    suffix: "P",
    placeholder: "예: 1000",
  },
  min_point_use: {
    type: "number",
    suffix: "P",
    placeholder: "0 = 제한 없음",
  },
  point_use_unit: {
    type: "number",
    suffix: "P 단위",
    placeholder: "예: 100",
  },
};

function displayValue(key: string, value: string): string {
  const config = SETTING_CONFIG[key];
  if (!config) return value;
  if (config.type === "percent") {
    return String(Math.round(Number(value) * 100));
  }
  return value;
}

function toDbValue(key: string, inputValue: string): string {
  const config = SETTING_CONFIG[key];
  if (!config) return inputValue;
  if (config.type === "percent") {
    return String(Number(inputValue) / 100);
  }
  return inputValue;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data.settings || []);
        const values: Record<string, string> = {};
        for (const s of data.settings || []) {
          values[s.key] = displayValue(s.key, s.value);
        }
        setEditValues(values);
      })
      .catch(() => setError("설정을 불러올 수 없습니다"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string) => {
    setSaving(key);
    setError("");
    setSaved(null);
    try {
      const dbValue = toDbValue(key, editValues[key]);
      const numVal = Number(dbValue);
      if (isNaN(numVal) || numVal < 0) {
        setError("올바른 숫자를 입력해주세요");
        return;
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: dbValue }),
      });

      if (!res.ok) throw new Error();

      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setError("저장에 실패했습니다");
    } finally {
      setSaving(null);
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
      <h1 className="text-2xl font-bold text-charcoal-400 mb-2">운영 설정</h1>
      <p className="text-sm text-charcoal-200 mb-8">
        포인트 적립률, 추천 보상 등 운영 정책을 설정합니다.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {settings.filter((s) => !s.key.startsWith("banner_") && !s.key.startsWith("review_point_")).map((setting) => {
          const config = SETTING_CONFIG[setting.key];
          return (
            <div
              key={setting.key}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-charcoal-400">
                    {setting.label}
                  </h3>
                  {setting.description && (
                    <p className="text-xs text-charcoal-200 mt-1">
                      {setting.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-[200px]">
                  <input
                    type="number"
                    value={editValues[setting.key] ?? ""}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        [setting.key]: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 pr-12 text-right text-lg font-semibold text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400"
                    placeholder={config?.placeholder}
                    min={0}
                    step={config?.type === "percent" ? "0.1" : "1"}
                  />
                  {config && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-charcoal-200">
                      {config.suffix}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleSave(setting.key)}
                  disabled={saving === setting.key}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    saved === setting.key
                      ? "bg-green-50 text-green-600"
                      : "bg-sage-400 text-white hover:bg-sage-500"
                  } disabled:opacity-50`}
                >
                  {saving === setting.key
                    ? "저장 중..."
                    : saved === setting.key
                    ? "저장됨!"
                    : "저장"}
                </button>
              </div>

              <p className="text-xs text-charcoal-100 mt-2">
                마지막 수정:{" "}
                {new Date(setting.updatedAt).toLocaleString("ko-KR")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
