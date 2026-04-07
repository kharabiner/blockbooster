"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { buttonVariants } from "@/lib/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, Store, ChevronDown, LogOut, Plus, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";

// B자 로고 — 크기가 다른 블록을 절대 위치로 조합
// 셀 7px, 간격 1px 기준 (4열 × 5행 = 31 × 39px)
//
//  [━━━━━━] [━━━━━━━━━━━━━━━━]  ← 1×1 tall-left + 2×1 top-bar
//  [      ]              [■]   ← top bump 1×1
//  [      ] [━━━━━━━━━━━━━━━━]  ← 2×1 mid-bar
//  [      ]              [■]   ← bottom bump 1×1
//  [      ] [━━━━━━━━━━━━━━━━]  ← 2×1 bot-bar

const C = 7;  // cell px
const G = 1;  // gap px
const S = C + G; // stride

type LogoBlock = { col: number; row: number; w: number; h: number; color: string };

// 팔레트: Purple / Yellow / Red / Green / Orange / Blue
const LOGO_BLOCKS: LogoBlock[] = [
  { col: 0, row: 0, w: 1, h: 5, color: "#7C3AED" },  // Purple — 왼쪽 기둥
  { col: 1, row: 0, w: 2, h: 1, color: "#F59E0B" },  // Yellow — 상단 바
  { col: 3, row: 1, w: 1, h: 1, color: "#EF4444" },  // Red    — 상단 범프
  { col: 1, row: 2, w: 2, h: 1, color: "#22C55E" },  // Green  — 중간 바
  { col: 3, row: 3, w: 1, h: 1, color: "#F97316" },  // Orange — 하단 범프
  { col: 1, row: 4, w: 2, h: 1, color: "#3B82F6" },  // Blue   — 하단 바
];

function BlockBLogo() {
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: 4 * S - G, height: 5 * S - G }}
    >
      {LOGO_BLOCKS.map((b, i) => (
        <div
          key={i}
          className="absolute border border-black/20"
          style={{
            left:   b.col * S,
            top:    b.row * S,
            width:  b.w * S - G,
            height: b.h * S - G,
            backgroundColor: b.color,
            borderRadius: "2.5px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          }}
        />
      ))}
    </div>
  );
}

export function Navbar() {
  const { data: session, status } = useSession();

  return (
      <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background shadow-[0_3px_0px_rgba(0,0,0,0.85)]">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2">
            {/* B자 블록 로고 */}
          <BlockBLogo />
          <span className="font-black text-lg text-foreground tracking-tight">
            BlockBooster
          </span>
        </Link>

        {/* 우측 액션 */}
        <div className="flex items-center gap-2">
          <Link
            href="/templates"
            className={cn(
              "inline-flex items-center gap-1 text-sm font-bold text-foreground/70 hover:text-foreground transition-colors px-2 py-1"
            )}
          >
            <LayoutTemplate className="h-4 w-4" />
            <span className="hidden sm:inline">템플릿</span>
          </Link>

          {status === "loading" ? null : session ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "font-bold gap-1")}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">만들기</span>
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 border-2 border-foreground shadow-[3px_3px_0px_rgba(0,0,0,0.85)]">
                  <DropdownMenuItem className="font-semibold cursor-pointer p-0">
                    <Link href="/dashboard/events/new" className="flex items-center gap-2 w-full px-2 py-1.5">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      이벤트 만들기
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="font-semibold cursor-pointer p-0">
                    <Link href="/my-booths/new" className="flex items-center gap-2 w-full px-2 py-1.5">
                      <Store className="h-4 w-4 text-green-600" />
                      부스 만들기
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5 bg-white/90 border-foreground"
                  )}
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={session.user?.image ?? ""} />
                    <AvatarFallback className="text-[10px] bg-accent text-accent-foreground font-black">
                      {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-xs font-bold max-w-[80px] truncate">
                    {session.user?.name}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-2 border-foreground shadow-[3px_3px_0px_rgba(0,0,0,0.85)]">
                  <div className="px-3 py-2 bg-muted/60 rounded-t-md">
                    <p className="text-sm font-bold">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="font-semibold cursor-pointer">
                    <Link href="/dashboard" className="flex items-center gap-2 w-full">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      내 이벤트
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="font-semibold cursor-pointer">
                    <Link href="/dashboard?tab=booths" className="flex items-center gap-2 w-full">
                      <Store className="h-4 w-4 text-green-600" />
                      내 부스
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-red-600 focus:text-red-600 cursor-pointer font-semibold"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                로그인
              </Link>
              <Link href="/register" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "font-bold")}>
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
