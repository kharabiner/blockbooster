"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

const TEST_PASSWORD = "devpassword123";
const TEST_ACCOUNTS = [
  { email: "organizer@blockbooster.kr", label: "이벤트 주최자", desc: "이벤트 생성 + 부스 슬롯 배치 완료", color: "bg-violet-100 border-violet-300 text-violet-900" },
  { email: "booth@blockbooster.kr",     label: "부스 운영자",   desc: "부스 생성 + 슬롯 신청 완료",       color: "bg-blue-100 border-blue-300 text-blue-900"   },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e?: string, p?: string) {
    setLoading(true);
    const result = await signIn("credentials", {
      email: e ?? email,
      password: p ?? password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      toast.success("환영합니다!");
      router.push(callbackUrl);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login();
  }

  async function handleTestLogin(email: string) {
    setEmail(email);
    setPassword(TEST_PASSWORD);
    await login(email, TEST_PASSWORD);
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
              로그인
            </Button>
          </form>

          <div className="px-6 pb-5 text-center">
            <p className="text-sm text-muted-foreground font-semibold">
              계정이 없으신가요?{" "}
              <Link
                href={callbackUrl !== "/dashboard" ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"}
                className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-0 font-black text-primary")}
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>

        {/* 테스트 계정 */}
        <div className="mt-4 p-3 bg-zinc-50 border-2 border-zinc-300 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,0.3)] space-y-2">
          <p className="text-xs font-black text-zinc-600">개발용 테스트 계정 (비밀번호: {TEST_PASSWORD})</p>
          {TEST_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => handleTestLogin(acc.email)}
              disabled={loading}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg border-2 transition-opacity hover:opacity-80",
                acc.color
              )}
            >
              <p className="text-xs font-black">{acc.label}</p>
              <p className="text-[11px] opacity-70">{acc.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
