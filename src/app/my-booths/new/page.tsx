"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NewBoothPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/booths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("부스 생성에 실패했습니다. 로그인이 필요합니다.");
      return;
    }
    toast.success("부스가 생성되었습니다!");
    router.push("/my-booths");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Link href="/my-booths" className={cn(buttonVariants({ variant: "ghost" }), "mb-6 -ml-2 inline-flex")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        내 부스
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>새 부스 만들기</CardTitle>
          <CardDescription>부스 프로필을 만들고 이벤트 슬롯에 연결하세요</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">부스 이름 *</Label>
              <Input id="name" placeholder="예: 홍길동 개발 프로젝트" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Input id="category" placeholder="예: 소프트웨어, 식품, 공예..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">소개</Label>
              <Textarea id="description" placeholder="부스를 소개해주세요" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              부스 만들기
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
