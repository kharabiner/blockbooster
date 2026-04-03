import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  // 기본: 레고 블록 스타일 — 두꺼운 테두리, 오프셋 섀도, 눌림 효과
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all outline-none select-none cursor-pointer " +
  "border-2 border-foreground shadow-[3px_3px_0px_rgba(0,0,0,0.85)] " +
  "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgba(0,0,0,0.85)] " +
  "focus-visible:ring-2 focus-visible:ring-ring/70 " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "bg-background text-foreground hover:bg-muted border-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-foreground",
        ghost:
          "border-transparent shadow-none bg-transparent hover:bg-muted text-foreground active:translate-x-0 active:translate-y-0",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 border-destructive",
        link:
          "border-transparent shadow-none text-primary underline-offset-4 hover:underline active:translate-x-0 active:translate-y-0",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs:      "h-6 px-2 text-xs rounded-md",
        sm:      "h-8 px-3 text-sm",
        lg:      "h-11 px-6 text-base",
        icon:    "size-9 p-0",
        "icon-sm": "size-8 p-0",
        "icon-lg": "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
