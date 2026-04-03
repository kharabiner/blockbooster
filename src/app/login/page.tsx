"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      toast.success("환영합니다! 🎉");
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* 블록 장식 */}
        <div className="flex justify-center gap-1.5 mb-6">
          {["bg-yellow-300","bg-red-400","bg-blue-400"].map((c, i) => (
            <div key={i} className={`w-7 h-7 ${c} border-2 border-foreground rounded-md shadow-[2px_2px_0px_rgba(0,0,0,0.8)]`} />
          ))}
        </div>

        <div className="bg-card rounded-2xl border-2 border-foreground shadow-[5px_5px_0px_rgba(0,0,0,0.85)] overflow-hidden">
          {/* 헤더 */}
          <div className="bg-primary px-6 py-4 border-b-2 border-foreground">
            <h1 className="text-xl font-black text-primary-foreground">로그인</h1>
            <p className="text-sm text-primary-foreground/70 font-semibold mt-0.5">BlockBooster에 오신 걸 환영해요!</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-bold text-sm">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-bold text-sm">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full font-black text-base h-10" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              로그인 🚀
            </Button>
          </form>

          <div className="px-6 pb-5 text-center">
            <p className="text-sm text-muted-foreground font-semibold">
              계정이 없으신가요?{" "}
              <Link href="/register" className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-0 font-black text-primary")}>
                회원가입
              </Link>
            </p>
          </div>
        </div>

        {/* 테스트 계정 힌트 */}
        <div className="mt-4 p-3 bg-yellow-100 border-2 border-yellow-400 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
          <p className="text-xs font-black text-yellow-800">🧪 테스트 계정</p>
          <p className="text-xs text-yellow-700 font-semibold">dev@blockbooster.kr / blockbooster123</p>
        </div>
      </div>
    </div>
  );
}
