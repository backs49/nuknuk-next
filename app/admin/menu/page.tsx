"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface MenuItem {
  id: string;
  name: string;
  nameEn?: string;
  price: number;
  category: string;
  image?: string;
  isPopular?: boolean;
  isNew?: boolean;
}

export default function MenuListPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [categoryLabels, setCategoryLabels] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    fetchItems();
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((cats: Array<{ id: string; name: string }>) => {
        const labels: Record<string, string> = {};
        cats.forEach((c) => {
          labels[c.id] = c.name;
        });
        setCategoryLabels(labels);
      })
      .catch(() => {});
  }, []);

  async function fetchItems() {
    try {
      const res = await fetch("/api/admin/menu");
      const data = await res.json();
      setItems(data);
    } catch {
      // fallback handled by API
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 메뉴를 삭제하시겠습니까?`)) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch {
      alert("삭제에 실패했습니다.");
    } finally {
      setDeleting(null);
    }
  }

  const filteredItems =
    filter === "all" ? items : items.filter((item) => item.category === filter);

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-charcoal-400">메뉴 관리</h1>
          <p className="text-sm text-charcoal-200 mt-1">
            {items.length}개의 메뉴
          </p>
        </div>
        <Link
          href="/admin/menu/new"
          className="px-4 py-2 sm:px-5 sm:py-2.5 bg-sage-400 text-white text-sm font-medium rounded-lg hover:bg-sage-500 transition whitespace-nowrap"
        >
          + 새 메뉴 추가
        </Link>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
        >
          전체
        </FilterButton>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <FilterButton
            key={key}
            active={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </FilterButton>
        ))}
      </div>

      {/* 테이블 */}
      {loading ? (
        <p className="text-charcoal-200">로딩 중...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-charcoal-200 uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4">
                    메뉴
                  </th>
                  <th className="text-left text-xs font-medium text-charcoal-200 uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4">
                    카테고리
                  </th>
                  <th className="text-right text-xs font-medium text-charcoal-200 uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4">
                    가격
                  </th>
                  <th className="text-center text-xs font-medium text-charcoal-200 uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4">
                    상태
                  </th>
                  <th className="text-right text-xs font-medium text-charcoal-200 uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-3">
                        {/* 썸네일 */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-cream-200 shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">
                              📷
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-charcoal-400 text-sm sm:text-base">
                            {item.name}
                          </p>
                          {item.nameEn && (
                            <p className="text-xs text-charcoal-100">
                              {item.nameEn}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className="text-sm text-charcoal-300">
                        {categoryLabels[item.category] || item.category}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <span className="font-medium text-charcoal-400 text-sm sm:text-base">
                        {item.price.toLocaleString()}원
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                      <div className="flex justify-center gap-1">
                        {item.isPopular && (
                          <span className="px-2 py-0.5 bg-sage-100 text-sage-500 text-xs rounded-full">
                            인기
                          </span>
                        )}
                        {item.isNew && (
                          <span className="px-2 py-0.5 bg-blush-100 text-blush-400 text-xs rounded-full">
                            NEW
                          </span>
                        )}
                        {!item.image && (
                          <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 text-xs rounded-full">
                            사진없음
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/menu/${item.id}`}
                          className="px-3 py-1.5 text-xs text-charcoal-300 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={deleting === item.id}
                          className="px-3 py-1.5 text-xs text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {deleting === item.id ? "..." : "삭제"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-charcoal-200">
              메뉴가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 sm:px-4 py-2 text-sm rounded-lg transition whitespace-nowrap ${
        active
          ? "bg-charcoal-400 text-white"
          : "bg-white text-charcoal-200 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
