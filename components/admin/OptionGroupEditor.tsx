"use client";

import { useState, useEffect } from "react";

interface OptionItem {
  name: string;
  price: number;
  sortOrder: number;
}

interface OptionGroup {
  id?: string;
  name: string;
  type: "single" | "multi";
  required: boolean;
  priceMode: "additional" | "fixed";
  sortOrder: number;
  items: OptionItem[];
}

interface OptionGroupEditorProps {
  menuItemId: string;
  onOptionsChange: (groups: OptionGroup[]) => void;
}

interface NewGroupForm {
  name: string;
  type: "single" | "multi";
  required: boolean;
  priceMode: "additional" | "fixed";
}

interface NewItemForm {
  name: string;
  price: string;
}

const DEFAULT_NEW_GROUP: NewGroupForm = {
  name: "",
  type: "single",
  required: false,
  priceMode: "additional",
};

export default function OptionGroupEditor({
  menuItemId,
  onOptionsChange,
}: OptionGroupEditorProps) {
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroup, setNewGroup] = useState<NewGroupForm>({ ...DEFAULT_NEW_GROUP });
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  const [editGroupForm, setEditGroupForm] = useState<NewGroupForm>({ ...DEFAULT_NEW_GROUP });
  const [newItemForms, setNewItemForms] = useState<Record<number, NewItemForm>>({});
  const [copyMenuList, setCopyMenuList] = useState<{ id: string; name: string; hasOptions: boolean }[]>([]);
  const [showCopyDropdown, setShowCopyDropdown] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);

  // Load initial option groups for edit mode
  useEffect(() => {
    if (!menuItemId) return;
    fetch(`/api/admin/menu/${menuItemId}/options`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: OptionGroup[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const sorted = data
            .map((g, i) => ({ ...g, sortOrder: i }))
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setGroups(sorted);
          onOptionsChange(sorted);
        }
      })
      .catch(() => {
        // silently ignore — groups start empty
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItemId]);

  function notifyChange(updated: OptionGroup[]) {
    const recalculated = updated.map((g, i) => ({ ...g, sortOrder: i }));
    setGroups(recalculated);
    onOptionsChange(recalculated);
  }

  function addGroup() {
    if (!newGroup.name.trim()) return;
    const group: OptionGroup = {
      name: newGroup.name.trim(),
      type: newGroup.type,
      required: newGroup.required,
      priceMode: newGroup.priceMode,
      sortOrder: groups.length,
      items: [],
    };
    notifyChange([...groups, group]);
    setNewGroup({ ...DEFAULT_NEW_GROUP });
    setShowAddForm(false);
  }

  function deleteGroup(index: number) {
    notifyChange(groups.filter((_, i) => i !== index));
  }

  function moveGroupUp(index: number) {
    if (index === 0) return;
    const updated = [...groups];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    notifyChange(updated);
  }

  function moveGroupDown(index: number) {
    if (index === groups.length - 1) return;
    const updated = [...groups];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    notifyChange(updated);
  }

  function startEditGroup(index: number) {
    const g = groups[index];
    setEditGroupForm({
      name: g.name,
      type: g.type,
      required: g.required,
      priceMode: g.priceMode,
    });
    setEditingGroupIndex(index);
  }

  function saveEditGroup() {
    if (editingGroupIndex === null) return;
    if (!editGroupForm.name.trim()) return;
    const updated = groups.map((g, i) =>
      i === editingGroupIndex
        ? { ...g, name: editGroupForm.name.trim(), type: editGroupForm.type, required: editGroupForm.required, priceMode: editGroupForm.priceMode }
        : g
    );
    notifyChange(updated);
    setEditingGroupIndex(null);
  }

  function cancelEditGroup() {
    setEditingGroupIndex(null);
  }

  function addItemToGroup(groupIndex: number) {
    const form = newItemForms[groupIndex];
    if (!form?.name?.trim()) return;
    const price = parseInt(form.price || "0", 10) || 0;
    const updated = groups.map((g, i) => {
      if (i !== groupIndex) return g;
      return {
        ...g,
        items: [
          ...g.items,
          { name: form.name.trim(), price, sortOrder: g.items.length },
        ],
      };
    });
    notifyChange(updated);
    setNewItemForms((prev) => ({ ...prev, [groupIndex]: { name: "", price: "" } }));
  }

  function deleteItem(groupIndex: number, itemIndex: number) {
    const updated = groups.map((g, i) => {
      if (i !== groupIndex) return g;
      return {
        ...g,
        items: g.items
          .filter((_, j) => j !== itemIndex)
          .map((item, j) => ({ ...item, sortOrder: j })),
      };
    });
    notifyChange(updated);
  }

  async function loadCopyMenuList() {
    setCopyLoading(true);
    try {
      const res = await fetch("/api/admin/menu");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      // data is array of menu items; we need to check which have options
      // We'll show all menus and let user pick
      const list = (Array.isArray(data) ? data : data.items || []).map(
        (m: { id: string; name: string }) => ({
          id: m.id,
          name: m.name,
          hasOptions: true, // we'll show all — server will handle empty gracefully
        })
      );
      setCopyMenuList(list.filter((m: { id: string }) => m.id !== menuItemId));
      setShowCopyDropdown(true);
    } catch {
      // silently ignore
    } finally {
      setCopyLoading(false);
    }
  }

  async function handleCopyFrom(sourceMenuId: string) {
    setShowCopyDropdown(false);
    try {
      const res = await fetch(`/api/admin/menu/${menuItemId}/options/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceMenuId }),
      });
      if (!res.ok) throw new Error("Copy failed");
      // Reload options
      const reloadRes = await fetch(`/api/admin/menu/${menuItemId}/options`);
      if (reloadRes.ok) {
        const data: OptionGroup[] = await reloadRes.json();
        if (Array.isArray(data)) {
          const sorted = data
            .map((g, i) => ({ ...g, sortOrder: i }))
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setGroups(sorted);
          onOptionsChange(sorted);
        }
      }
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="space-y-4">
      {groups.length === 0 && !showAddForm && (
        <p className="text-sm text-charcoal-100 italic py-2">
          옵션 그룹이 없습니다. 아래 버튼을 눌러 추가하세요.
        </p>
      )}

      {/* Group cards */}
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Group header */}
          {editingGroupIndex === groupIndex ? (
            <div className="bg-amber-50 border-b-2 border-amber-400 p-3 sm:p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-charcoal-300 mb-1">그룹명</label>
                  <input
                    type="text"
                    value={editGroupForm.name}
                    onChange={(e) => setEditGroupForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-charcoal-300 mb-1">타입</label>
                    <div className="flex gap-3">
                      {(["single", "multi"] as const).map((t) => (
                        <label key={t} className="flex items-center gap-1 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name={`edit-type-${groupIndex}`}
                            value={t}
                            checked={editGroupForm.type === t}
                            onChange={() => setEditGroupForm((f) => ({ ...f, type: t }))}
                          />
                          {t === "single" ? "택1" : "다중"}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editGroupForm.required}
                    onChange={(e) => setEditGroupForm((f) => ({ ...f, required: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  필수
                </label>
                <div className="flex gap-3">
                  {(["additional", "fixed"] as const).map((pm) => (
                    <label key={pm} className="flex items-center gap-1 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`edit-pricemode-${groupIndex}`}
                        value={pm}
                        checked={editGroupForm.priceMode === pm}
                        onChange={() => setEditGroupForm((f) => ({ ...f, priceMode: pm }))}
                      />
                      {pm === "additional" ? "추가금" : "고정가"}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEditGroup}
                  className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                >
                  확인
                </button>
                <button
                  type="button"
                  onClick={cancelEditGroup}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 bg-gray-50 border-b border-gray-200 px-3 sm:px-4 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-charcoal-400">{group.name}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${group.required ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {group.required ? "필수" : "선택"}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-blue-100 text-blue-700">
                  {group.type === "single" ? "택1" : "다중"}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${group.priceMode === "additional" ? "bg-amber-100 text-amber-700" : "bg-pink-100 text-pink-700"}`}>
                  {group.priceMode === "additional" ? "추가금" : "고정가"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveGroupUp(groupIndex)}
                  disabled={groupIndex === 0}
                  className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs"
                  title="위로 이동"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveGroupDown(groupIndex)}
                  disabled={groupIndex === groups.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition text-xs"
                  title="아래로 이동"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => startEditGroup(groupIndex)}
                  className="w-7 h-7 flex items-center justify-center rounded text-blue-500 hover:bg-blue-50 transition text-xs"
                  title="편집"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => deleteGroup(groupIndex)}
                  className="w-7 h-7 flex items-center justify-center rounded text-red-400 hover:bg-red-50 transition text-xs font-bold"
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Group body: items table */}
          <div className="p-4 bg-white space-y-3">
            {group.items.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-charcoal-100 border-b border-gray-100">
                    <th className="text-left pb-1 font-medium">항목명</th>
                    <th className="text-right pb-1 font-medium w-24">가격 (원)</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item, itemIndex) => (
                    <tr key={itemIndex} className="border-b border-gray-50">
                      <td className="py-1.5 text-charcoal-300">{item.name}</td>
                      <td className="py-1.5 text-right text-charcoal-300">
                        {item.price > 0 ? `+${item.price.toLocaleString()}` : "0"}
                      </td>
                      <td className="py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => deleteItem(groupIndex, itemIndex)}
                          className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-50 transition text-xs font-bold ml-auto"
                          title="항목 삭제"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-charcoal-100 italic">항목이 없습니다.</p>
            )}

            {/* Inline add item row */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="항목명"
                value={newItemForms[groupIndex]?.name || ""}
                onChange={(e) =>
                  setNewItemForms((prev) => ({
                    ...prev,
                    [groupIndex]: { ...prev[groupIndex], name: e.target.value },
                  }))
                }
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sage-300"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItemToGroup(groupIndex);
                  }
                }}
              />
              <input
                type="number"
                placeholder="가격"
                value={newItemForms[groupIndex]?.price || ""}
                onChange={(e) =>
                  setNewItemForms((prev) => ({
                    ...prev,
                    [groupIndex]: { ...prev[groupIndex], price: e.target.value },
                  }))
                }
                className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sage-300"
                min={0}
                step={500}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItemToGroup(groupIndex);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addItemToGroup(groupIndex)}
                className="px-3 py-1.5 text-sm font-medium text-sage-400 border border-sage-300 rounded-lg hover:bg-green-50 transition whitespace-nowrap"
                style={{ borderColor: "#6B8E23", color: "#6B8E23" }}
              >
                항목 추가
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Inline add group form */}
      {showAddForm && (
        <div className="border-2 border-dashed border-sage-300 rounded-xl p-4 bg-green-50 space-y-3"
          style={{ borderColor: "#6B8E23" }}>
          <h3 className="text-sm font-semibold text-charcoal-400">새 옵션 그룹</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-charcoal-300 mb-1">그룹명</label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup((f) => ({ ...f, name: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-sage-300"
                placeholder="예: 사이즈"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addGroup();
                  }
                  if (e.key === "Escape") {
                    setShowAddForm(false);
                    setNewGroup({ ...DEFAULT_NEW_GROUP });
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-charcoal-300 mb-1">타입</label>
                <div className="flex gap-4">
                  {(["single", "multi"] as const).map((t) => (
                    <label key={t} className="flex items-center gap-1 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="new-group-type"
                        value={t}
                        checked={newGroup.type === t}
                        onChange={() => setNewGroup((f) => ({ ...f, type: t }))}
                      />
                      {t === "single" ? "택1" : "다중"}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newGroup.required}
                onChange={(e) => setNewGroup((f) => ({ ...f, required: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300"
              />
              필수
            </label>
            <div>
              <span className="text-xs font-medium text-charcoal-300 mr-2">가격 방식</span>
              <div className="inline-flex gap-4">
                {(["additional", "fixed"] as const).map((pm) => (
                  <label key={pm} className="flex items-center gap-1 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="new-group-pricemode"
                      value={pm}
                      checked={newGroup.priceMode === pm}
                      onChange={() => setNewGroup((f) => ({ ...f, priceMode: pm }))}
                    />
                    {pm === "additional" ? "추가금" : "고정가"}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addGroup}
              className="px-4 py-1.5 text-sm font-medium bg-sage-400 text-white rounded-lg hover:bg-sage-500 transition"
              style={{ backgroundColor: "#6B8E23" }}
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewGroup({ ...DEFAULT_NEW_GROUP });
              }}
              className="px-4 py-1.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border rounded-lg transition"
            style={{ borderColor: "#6B8E23", color: "#6B8E23", backgroundColor: "#f0fdf4" }}
          >
            <span className="text-base leading-none">+</span>
            옵션 그룹 추가
          </button>
        )}

        {/* Copy from another menu */}
        {menuItemId && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (!showCopyDropdown) {
                  loadCopyMenuList();
                } else {
                  setShowCopyDropdown(false);
                }
              }}
              disabled={copyLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
            >
              {copyLoading ? "불러오는 중..." : "다른 메뉴에서 복사"}
            </button>

            {showCopyDropdown && copyMenuList.length > 0 && (
              <div className="absolute top-full mt-1 left-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[200px] max-h-60 overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs text-charcoal-100 px-2 pb-1">메뉴를 선택하면 해당 메뉴의 옵션을 복사합니다</p>
                  {copyMenuList.map((menu) => (
                    <button
                      key={menu.id}
                      type="button"
                      onClick={() => handleCopyFrom(menu.id)}
                      className="w-full text-left px-3 py-2 text-sm text-charcoal-300 hover:bg-gray-50 rounded-lg transition"
                    >
                      {menu.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showCopyDropdown && copyMenuList.length === 0 && !copyLoading && (
              <div className="absolute top-full mt-1 left-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[200px]">
                <div className="p-4 text-sm text-charcoal-100">복사할 수 있는 메뉴가 없습니다.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
