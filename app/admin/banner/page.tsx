"use client";

import { useState, useEffect } from "react";

interface BannerSettings {
  enabled: boolean;
  text: string;
  link: string;
  bgColor: string;
  textColor: string;
}

const COLOR_PRESETS = [
  { label: "쑥잎 그린", bg: "#6B8E23", text: "#FFFFFF" },
  { label: "블러쉬 핑크", bg: "#E8998D", text: "#FFFFFF" },
  { label: "차콜", bg: "#2A2A2A", text: "#FFFFFF" },
  { label: "크림", bg: "#FDFBF7", text: "#2A2A2A" },
  { label: "옐로우", bg: "#FEE500", text: "#2A2A2A" },
];

export default function BannerPage() {
  const [settings, setSettings] = useState<BannerSettings>({
    enabled: false,
    text: "",
    link: "",
    bgColor: "#6B8E23",
    textColor: "#FFFFFF",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/banner")
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          enabled: data.enabled ?? false,
          text: data.text ?? "",
          link: data.link ?? "",
          bgColor: data.bgColor ?? "#6B8E23",
          textColor: data.textColor ?? "#FFFFFF",
        });
      })
      .catch(() => setError("설정을 불러올 수 없습니다"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const pairs = [
        { key: "banner_enabled", value: String(settings.enabled) },
        { key: "banner_text", value: settings.text || "" },
        { key: "banner_link", value: settings.link || "" },
        { key: "banner_bg_color", value: settings.bgColor },
        { key: "banner_text_color", value: settings.textColor },
      ];

      for (const pair of pairs) {
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pair),
        });
        if (!res.ok) throw new Error();
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("저장에 실패했습니다");
    } finally {
      setSaving(false);
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
      <h1 className="text-2xl font-bold text-charcoal-400 mb-2">
        공지 배너 관리
      </h1>
      <p className="text-sm text-charcoal-200 mb-8">
        사이트 상단에 표시되는 공지 배너를 설정합니다.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* 미리보기 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-charcoal-400 mb-3">미리보기</h3>
          {settings.text ? (
            <div
              className="rounded-lg px-4 py-2.5 text-center text-sm font-medium"
              style={{
                backgroundColor: settings.bgColor,
                color: settings.textColor,
              }}
            >
              {settings.text}
            </div>
          ) : (
            <div className="rounded-lg px-4 py-2.5 text-center text-sm text-charcoal-200 border border-dashed border-gray-200">
              배너 문구를 입력하면 미리보기가 표시됩니다
            </div>
          )}
        </div>

        {/* 활성화 토글 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-charcoal-400">배너 활성화</h3>
              <p className="text-xs text-charcoal-200 mt-1">
                끄면 고객에게 배너가 표시되지 않습니다
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.enabled ? "bg-sage-400" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  settings.enabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* 문구 */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              배너 문구
            </label>
            <input
              type="text"
              value={settings.text}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, text: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400"
              placeholder="예: 설 선물세트 사전 예약 진행 중!"
              maxLength={100}
            />
            <p className="text-xs text-charcoal-100 text-right mt-1">
              {settings.text.length}/100
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal-300 mb-1">
              링크 URL
              <span className="text-charcoal-100 font-normal ml-1">
                (선택)
              </span>
            </label>
            <input
              type="text"
              value={settings.link}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, link: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400"
              placeholder="예: /menu/seolnal-set 또는 https://naver.me/..."
            />
            <p className="text-xs text-charcoal-100 mt-1">
              비워두면 클릭 불가. 내부 경로(/) 또는 외부 URL(https://) 모두 가능
            </p>
          </div>
        </div>

        {/* 색상 */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-charcoal-400">색상</h3>

          {/* 프리셋 */}
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    bgColor: preset.bg,
                    textColor: preset.text,
                  }))
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition ${
                  settings.bgColor === preset.bg &&
                  settings.textColor === preset.text
                    ? "border-sage-400"
                    : "border-transparent"
                }`}
                style={{
                  backgroundColor: preset.bg,
                  color: preset.text,
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* 커스텀 색상 */}
          <div className="flex gap-4">
            <div>
              <label className="block text-xs text-charcoal-200 mb-1">
                배경색
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.bgColor}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      bgColor: e.target.value,
                    }))
                  }
                  className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={settings.bgColor}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      bgColor: e.target.value,
                    }))
                  }
                  className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-charcoal-200 mb-1">
                글자색
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.textColor}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      textColor: e.target.value,
                    }))
                  }
                  className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={settings.textColor}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      textColor: e.target.value,
                    }))
                  }
                  className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition ${
            saved
              ? "bg-green-50 text-green-600"
              : "bg-sage-400 text-white hover:bg-sage-500"
          } disabled:opacity-50`}
        >
          {saving ? "저장 중..." : saved ? "저장 완료!" : "배너 설정 저장"}
        </button>
      </div>
    </div>
  );
}
