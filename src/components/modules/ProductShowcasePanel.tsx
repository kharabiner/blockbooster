"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ShoppingBag, Tag, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { ModulePanelProps } from "./ModulePanel";

type Product = {
  id: string;
  name: string;
  price?: number | null;
  description?: string;
  imageUrl?: string;
};

type StoreData = { products: Product[] };

export function ProductShowcasePanel({ slotId, moduleId, config, isOperator }: ModulePanelProps) {
  const { data: session } = useSession();
  const showPrice = config.showPrice !== false;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Product[]>([]);

  useEffect(() => {
    fetch(`/api/slots/${slotId}/modules/${moduleId}`)
      .then((r) => r.json())
      .then((d: { data?: StoreData }) => {
        const list = d?.data?.products ?? [];
        setProducts(list);
        setDraft(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slotId, moduleId]);

  function addProduct() {
    setDraft((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", price: null, description: "" },
    ]);
  }

  function removeProduct(id: string) {
    setDraft((prev) => prev.filter((p) => p.id !== id));
  }

  function updateProduct(id: string, field: keyof Product, value: string | number | null) {
    setDraft((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  async function save() {
    const res = await fetch(`/api/slots/${slotId}/modules/${moduleId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: draft }),
    });
    if (res.ok) {
      setProducts(draft);
      setEditing(false);
      toast.success("상품 목록이 저장되었습니다.");
    } else {
      toast.error("저장에 실패했습니다.");
    }
  }

  function cancelEdit() {
    setDraft(products);
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="rounded-xl border p-4 bg-card">
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-indigo-500" />
          <span className="font-medium text-sm">상품 목록</span>
        </div>
        {isOperator && session && !editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-xs">
            <Pencil className="h-3 w-3 mr-1" />
            편집
          </Button>
        )}
        {editing && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-xs text-muted-foreground">
              <X className="h-3 w-3 mr-1" />취소
            </Button>
            <Button size="sm" onClick={save} className="text-xs">
              <Check className="h-3 w-3 mr-1" />저장
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {draft.map((product) => (
            <div key={product.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <div className="flex gap-2">
                <Input
                  placeholder="상품명 *"
                  value={product.name}
                  onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                  className="flex-1 h-8 text-sm"
                />
                {showPrice && (
                  <Input
                    type="number"
                    placeholder="가격"
                    value={product.price ?? ""}
                    onChange={(e) => updateProduct(product.id, "price", e.target.value ? Number(e.target.value) : null)}
                    className="w-24 h-8 text-sm"
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProduct(product.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Textarea
                placeholder="상품 설명 (선택)"
                value={product.description ?? ""}
                onChange={(e) => updateProduct(product.id, "description", e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addProduct} className="w-full text-xs">
            <Plus className="h-3 w-3 mr-1" />
            상품 추가
          </Button>
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {isOperator ? "아직 상품이 없습니다. 편집 버튼으로 추가해보세요." : "등록된 상품이 없습니다."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg p-3 bg-background space-y-1">
              <p className="font-medium text-sm leading-snug">{product.name}</p>
              {product.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>
              )}
              {showPrice && product.price != null && (
                <div className="flex items-center gap-1 text-indigo-600 font-semibold text-sm">
                  <Tag className="h-3 w-3" />
                  {product.price.toLocaleString()}원
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
