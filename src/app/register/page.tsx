"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error ?? "회원가입에 실패했습니다.");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    toast.success("가입 완료!");
    setLoading(false);
    router.push(callbackUrl);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center gap-1.5 mb-6">
          {["bg-green-400","bg-yellow-300","bg-purple-400"].map((c, i) => (
            <div key={i} className={`w-7 h-7 ${c} border-2 border-foreground rounded-md shadow-[2px_2px_0px_rgba(0,0,0,0.8)]`} />
          ))}
        </div>

        <div className="bg-card rounded-2xl border-2 border-foreground shadow-[5px_5px_0px_rgba(0,0,0,0.85)] overflow-hidden">
          <div className="bg-green-500 px-6 py-4 border-b-2 border-foreground">
            <h1 className="text-xl font-black text-white">회원가입</h1>
            <p className="text-sm text-white/70 font-semibold mt-0.5">나만의 이벤트를 만들어보세요!</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="font-bold text-sm">이름 (닉네임)</Label>
              <Input id="name" placeholder="홍길동" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-bold text-sm">이메일</Label>
              <Input id="email" type="email" placeholder="hello@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-bold text-sm">비밀번호</Label>
              <Input id="password" type="password" placeholder="8자 이상" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            <Button type="submit" className="w-full font-black text-base h-10 bg-green-500 hover:bg-green-600 border-foreground" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              시작하기
            </Button>
          </form>

          <div className="px-6 pb-5 text-center">
            <p className="text-sm text-muted-foreground font-semibold">
              이미 계정이 있으신가요?{" "}
              <Link
                href={callbackUrl !== "/dashboard" ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
                className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-0 font-black text-primary")}
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

