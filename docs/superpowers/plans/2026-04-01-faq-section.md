# FAQ 섹션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈페이지 메인에 아코디언 형태의 FAQ 섹션을 추가하고, 관리자가 FAQ 항목을 CRUD할 수 있는 관리 페이지를 구현한다.

**Architecture:** Supabase `faq_items` 테이블에 FAQ 데이터를 저장하고, 공개 API(`/api/faq`)와 관리자 API(`/api/admin/faq`)를 통해 접근한다. 고객 화면은 `FAQSection` 아코디언 컴포넌트로, 관리자 화면은 `/admin/faq` 페이지에서 CRUD + 순서 변경을 제공한다. `NEXT_PUBLIC_ENABLE_FAQ` 환경변수로 전체 기능을 제어한다.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL), Framer Motion, Tailwind CSS

---

## File Structure

### 신규 생성

| 파일 | 책임 |
|------|------|
| `supabase/faq-schema.sql` | DDL — faq_items 테이블 생성 |
| `lib/faq-db.ts` | DB 함수 — getActiveFAQs, getAllFAQs, createFAQ, updateFAQ, deleteFAQ, reorderFAQs |
| `app/api/faq/route.ts` | 공개 API — 활성 FAQ 목록 조회 |
| `app/api/admin/faq/route.ts` | 관리자 API — 전체 목록 조회 + 항목 추가 |
| `app/api/admin/faq/[id]/route.ts` | 관리자 API — 항목 수정 + 삭제 |
| `app/api/admin/faq/reorder/route.ts` | 관리자 API — 순서 변경 |
| `app/admin/faq/page.tsx` | 관리자 FAQ 관리 페이지 |
| `components/FAQSection.tsx` | 고객 화면 아코디언 컴포넌트 |

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `lib/feature-flags.ts` | `FAQ_ENABLED` 플래그 추가 |
| `app/page.tsx` | `FAQSection` 컴포넌트 추가 |
| `app/admin/layout.tsx` | FAQ 관리 네비 항목 추가 |
| `components/Header.tsx` | FAQ 네비 링크 추가 (조건부) |

---

### Task 1: DB 스키마 + DB 함수

**Files:**
- Create: `supabase/faq-schema.sql`
- Create: `lib/faq-db.ts`
- Modify: `lib/feature-flags.ts`

- [ ] **Step 1: DDL 작성**

`supabase/faq-schema.sql`:

```sql
-- FAQ 항목 테이블
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faq_items_sort ON faq_items(sort_order);

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faq_items_service_role" ON faq_items
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "faq_items_public_read" ON faq_items
  FOR SELECT USING (is_active = true);
```

- [ ] **Step 2: Supabase SQL Editor에서 DDL 실행**

Supabase 대시보드 → SQL Editor → 위 SQL 붙여넣기 → Run.

- [ ] **Step 3: feature-flags에 FAQ_ENABLED 추가**

`lib/feature-flags.ts` 끝에 추가:

```typescript
export const FAQ_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_FAQ === 'true'
```

- [ ] **Step 4: DB 함수 작성**

`lib/faq-db.ts`:

```typescript
// lib/faq-db.ts
// FAQ CRUD — faq_items 테이블

import { getSupabaseOrThrow } from './db-utils'

export interface DbFAQItem {
  id: string
  question: string
  answer: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function toFAQItem(db: DbFAQItem): FAQItem {
  return {
    id: db.id,
    question: db.question,
    answer: db.answer,
    sortOrder: db.sort_order,
    isActive: db.is_active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

// 활성 FAQ 목록 (고객용 — is_active=true만, sort_order 오름차순)
export async function getActiveFAQs(): Promise<FAQItem[]> {
  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase
    .from('faq_items')
    .select()
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`FAQ 조회 실패: ${error.message}`)
  return (data as DbFAQItem[]).map(toFAQItem)
}

// 전체 FAQ 목록 (관리자용 — 비활성 포함, sort_order 오름차순)
export async function getAllFAQs(): Promise<FAQItem[]> {
  const supabase = getSupabaseOrThrow()

  const { data, error } = await supabase
    .from('faq_items')
    .select()
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`FAQ 조회 실패: ${error.message}`)
  return (data as DbFAQItem[]).map(toFAQItem)
}

// FAQ 항목 추가
export async function createFAQ(input: {
  question: string
  answer: string
}): Promise<FAQItem> {
  const supabase = getSupabaseOrThrow()

  // 현재 최대 sort_order 조회
  const { data: maxRow } = await supabase
    .from('faq_items')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxRow?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('faq_items')
    .insert({
      question: input.question,
      answer: input.answer,
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) throw new Error(`FAQ 추가 실패: ${error.message}`)
  return toFAQItem(data as DbFAQItem)
}

// FAQ 항목 수정
export async function updateFAQ(
  id: string,
  input: { question?: string; answer?: string; isActive?: boolean }
): Promise<FAQItem> {
  const supabase = getSupabaseOrThrow()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.question !== undefined) updateData.question = input.question
  if (input.answer !== undefined) updateData.answer = input.answer
  if (input.isActive !== undefined) updateData.is_active = input.isActive

  const { data, error } = await supabase
    .from('faq_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`FAQ 수정 실패: ${error.message}`)
  return toFAQItem(data as DbFAQItem)
}

// FAQ 항목 삭제
export async function deleteFAQ(id: string): Promise<void> {
  const supabase = getSupabaseOrThrow()

  const { error } = await supabase
    .from('faq_items')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`FAQ 삭제 실패: ${error.message}`)
}

// FAQ 순서 변경 (id 배열 순서대로 sort_order 업데이트)
export async function reorderFAQs(orderedIds: string[]): Promise<void> {
  const supabase = getSupabaseOrThrow()

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('faq_items')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) throw new Error(`FAQ 순서 변경 실패: ${failed.error.message}`)
}
```

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공 (아직 import하는 곳 없으므로 tree-shake됨)

- [ ] **Step 6: 커밋**

```bash
git add supabase/faq-schema.sql lib/faq-db.ts lib/feature-flags.ts
git commit -m "feat: FAQ 테이블 스키마 및 DB 함수 추가"
```

---

### Task 2: API 라우트 (공개 + 관리자)

**Files:**
- Create: `app/api/faq/route.ts`
- Create: `app/api/admin/faq/route.ts`
- Create: `app/api/admin/faq/[id]/route.ts`
- Create: `app/api/admin/faq/reorder/route.ts`

- [ ] **Step 1: 공개 FAQ API 작성**

`app/api/faq/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getActiveFAQs } from '@/lib/faq-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const faqs = await getActiveFAQs()
    return NextResponse.json({ faqs })
  } catch (error) {
    console.error('FAQ fetch error:', error)
    return NextResponse.json({ faqs: [] })
  }
}
```

- [ ] **Step 2: 관리자 목록 조회 + 추가 API 작성**

`app/api/admin/faq/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllFAQs, createFAQ } from '@/lib/faq-db'

export const dynamic = 'force-dynamic'

// GET: 전체 FAQ 목록 (비활성 포함)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  try {
    const faqs = await getAllFAQs()
    return NextResponse.json({ faqs })
  } catch (error) {
    const message = error instanceof Error ? error.message : '조회 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: FAQ 항목 추가
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  try {
    const body = await request.json()
    const { question, answer } = body

    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json({ error: '질문과 답변을 모두 입력해주세요' }, { status: 400 })
    }

    const faq = await createFAQ({ question: question.trim(), answer: answer.trim() })
    return NextResponse.json({ faq })
  } catch (error) {
    const message = error instanceof Error ? error.message : '추가 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 3: 관리자 수정 + 삭제 API 작성**

`app/api/admin/faq/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateFAQ, deleteFAQ } from '@/lib/faq-db'

export const dynamic = 'force-dynamic'

// PUT: FAQ 항목 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json()
    const faq = await updateFAQ(id, body)
    return NextResponse.json({ faq })
  } catch (error) {
    const message = error instanceof Error ? error.message : '수정 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE: FAQ 항목 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await params

  try {
    await deleteFAQ(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '삭제 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: 순서 변경 API 작성**

`app/api/admin/faq/reorder/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { reorderFAQs } from '@/lib/faq-db'

export const dynamic = 'force-dynamic'

// PUT: FAQ 순서 변경
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  try {
    const body = await request.json()
    const { orderedIds } = body

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds 배열이 필요합니다' }, { status: 400 })
    }

    await reorderFAQs(orderedIds)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '순서 변경 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공

- [ ] **Step 6: 커밋**

```bash
git add app/api/faq/ app/api/admin/faq/
git commit -m "feat: FAQ 공개/관리자 API 라우트 추가"
```

---

### Task 3: 관리자 FAQ 관리 페이지

**Files:**
- Create: `app/admin/faq/page.tsx`
- Modify: `app/admin/layout.tsx`

- [ ] **Step 1: 관리자 FAQ 관리 페이지 작성**

`app/admin/faq/page.tsx`:

```tsx
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
        // 수정
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
        // 추가
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
                  {/* 순서 버튼 */}
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
                  {/* 활성/비활성 토글 */}
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
                  {/* 수정 */}
                  <button
                    onClick={() => handleEdit(faq)}
                    className="w-7 h-7 flex items-center justify-center text-xs text-charcoal-200 hover:bg-gray-100 rounded"
                    title="수정"
                  >
                    ✏️
                  </button>
                  {/* 삭제 */}
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
```

- [ ] **Step 2: admin layout에 FAQ 네비 추가**

`app/admin/layout.tsx`의 `navItems` 배열에서, 배너 항목 근처에 FAQ 항목을 추가:

```typescript
// 기존 배너 항목 뒤에 추가
{ href: "/admin/faq", label: "FAQ 관리", icon: "❓" },
```

이 항목은 `FAQ_ENABLED` 플래그로 조건부 렌더링:

```typescript
...(FAQ_ENABLED
  ? [{ href: "/admin/faq", label: "FAQ 관리", icon: "❓" }]
  : []),
```

파일 상단에 import 추가:

```typescript
import { FAQ_ENABLED } from "@/lib/feature-flags";
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add app/admin/faq/ app/admin/layout.tsx
git commit -m "feat: 관리자 FAQ 관리 페이지 추가"
```

---

### Task 4: 고객 화면 FAQSection 컴포넌트

**Files:**
- Create: `components/FAQSection.tsx`
- Modify: `app/page.tsx`
- Modify: `components/Header.tsx`

- [ ] **Step 1: FAQSection 아코디언 컴포넌트 작성**

`components/FAQSection.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FadeIn from "@/components/FadeIn";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/faq")
      .then((res) => res.json())
      .then((data) => setFaqs(data.faqs || []))
      .catch(() => {});
  }, []);

  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="section-padding bg-cream-100">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="text-xs tracking-[0.3em] text-sage-400 uppercase font-medium">
              FAQ
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-charcoal-400 mt-2">
              자주 묻는 질문
            </h2>
          </div>
        </FadeIn>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FadeIn key={faq.id} delay={index * 0.05}>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() =>
                    setOpenId(openId === faq.id ? null : faq.id)
                  }
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-charcoal-400 text-sm md:text-base pr-4">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: openId === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-charcoal-200 shrink-0"
                  >
                    ▾
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-4 text-sm text-charcoal-200 leading-relaxed whitespace-pre-wrap">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* 추가 문의 안내 */}
        <FadeIn delay={0.2}>
          <div className="text-center mt-8">
            <p className="text-sm text-charcoal-200">
              더 궁금한 점이 있으신가요?
            </p>
            <a
              href="https://pf.kakao.com/_nuknuk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm font-medium text-sage-400 hover:text-sage-500 transition-colors"
            >
              카카오톡으로 문의하기 →
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 메인 페이지에 FAQSection 추가**

`app/page.tsx`를 수정:

상단에 import 추가:

```typescript
import FAQSection from "@/components/FAQSection";
import { FAQ_ENABLED } from "@/lib/feature-flags";
```

JSX에서 `<LocationSection />` 다음, `<InstagramFeed />` 전에 추가:

```tsx
<LocationSection />
{FAQ_ENABLED && <FAQSection />}
<InstagramFeed />
```

- [ ] **Step 3: 헤더에 FAQ 네비 링크 추가**

`components/Header.tsx`를 수정:

상단에 import 추가:

```typescript
import { FAQ_ENABLED } from "@/lib/feature-flags";
```

`navLinks` 배열을 조건부로 구성:

```typescript
const navLinks = [
  { href: "#menu", label: "메뉴" },
  { href: "#about", label: "소개" },
  { href: "#location", label: "오시는 길" },
  ...(FAQ_ENABLED ? [{ href: "#faq", label: "FAQ" }] : []),
  { href: "#instagram", label: "인스타그램" },
];
```

**주의:** `navLinks`는 컴포넌트 바깥에 선언되어 있으므로 그대로 바깥에서 조건부 구성하면 됨. `FAQ_ENABLED`는 빌드 타임 상수이므로 문제 없음.

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공

- [ ] **Step 5: 로컬 테스트**

Run: `npm run dev`

1. 환경변수 `.env.local`에 `NEXT_PUBLIC_ENABLE_FAQ=true` 추가
2. Supabase에서 faq_items에 테스트 데이터 2~3개 삽입
3. 홈페이지에서 FAQ 섹션이 LocationSection 아래에 표시되는지 확인
4. 아코디언 클릭 시 답변 펼침/접힘 동작 확인
5. 헤더에 FAQ 링크가 표시되고 클릭 시 해당 섹션으로 스크롤되는지 확인
6. `/admin/faq`에서 추가/수정/삭제/순서 변경/활성 토글 동작 확인
7. `NEXT_PUBLIC_ENABLE_FAQ`를 제거하면 FAQ 섹션과 헤더 링크가 모두 숨겨지는지 확인

- [ ] **Step 6: 커밋**

```bash
git add components/FAQSection.tsx app/page.tsx components/Header.tsx
git commit -m "feat: 고객 FAQ 아코디언 섹션 및 헤더 연동"
```

---

## Self-Review Checklist

### Spec Coverage
| 스펙 요구사항 | 구현 태스크 |
|-------------|-----------|
| faq_items 테이블 | Task 1, Step 1 |
| DB 함수 (CRUD + reorder) | Task 1, Step 4 |
| 공개 API (/api/faq) | Task 2, Step 1 |
| 관리자 API (CRUD + reorder) | Task 2, Steps 2-4 |
| 관리자 관리 페이지 | Task 3, Step 1 |
| admin layout 네비 추가 | Task 3, Step 2 |
| 고객 아코디언 컴포넌트 | Task 4, Step 1 |
| 메인 페이지에 섹션 추가 | Task 4, Step 2 |
| 헤더 FAQ 링크 | Task 4, Step 3 |
| NEXT_PUBLIC_ENABLE_FAQ 환경변수 | Task 1 Step 3, Task 3 Step 2, Task 4 Steps 2-3 |
| force-dynamic 설정 | Task 2, 모든 route |
| 한 번에 하나만 펼침 | Task 4, Step 1 (openId 상태) |
| 카카오톡 문의 링크 | Task 4, Step 1 (하단 안내) |
| 비활성 항목 시각적 구분 | Task 3, Step 1 (opacity-50) |
| 순서 변경 (▲▼ 버튼) | Task 3, Step 1 (handleMove) |

### Placeholder Scan
None found — all code blocks are complete.

### Type Consistency
- `FAQItem` interface: consistent across faq-db.ts, admin page, customer component
- `DbFAQItem` → `toFAQItem()` conversion: consistent field mapping
- API request/response shapes: consistent across all routes
