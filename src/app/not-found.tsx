import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl font-black text-muted-foreground/20 mb-4 select-none">404</div>
      <h1 className="text-2xl font-bold mb-2">페이지를 찾을 수 없습니다</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <div className="flex gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          <Home className="mr-2 h-4 w-4" />
          홈으로
        </Link>
        <Link href="/templates" className={cn(buttonVariants({ variant: "outline" }))}>
          <Search className="mr-2 h-4 w-4" />
          템플릿 보기
        </Link>
      </div>
    </div>
  );
}
