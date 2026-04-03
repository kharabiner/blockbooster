import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border-2 border-foreground bg-background px-3 py-1.5 text-sm font-semibold shadow-[2px_2px_0px_rgba(0,0,0,0.85)] transition-all outline-none placeholder:text-muted-foreground placeholder:font-normal focus-visible:border-primary focus-visible:shadow-[2px_2px_0px] focus-visible:shadow-primary/70 focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
