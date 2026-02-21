"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = ({ className, ...props }: SheetPrimitive.DialogOverlayProps) => (
  <SheetPrimitive.Overlay
    className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", className)}
    {...props}
  />
);
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const SheetContent = ({ className, children, ...props }: SheetPrimitive.DialogContentProps) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col rounded-l-3xl bg-white p-6 shadow-2xl focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-6 top-6 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:text-slate-900">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-2 text-left", className)} {...props} />
);

const SheetTitle = ({ className, ...props }: SheetPrimitive.DialogTitleProps) => (
  <SheetPrimitive.Title className={cn("text-2xl font-semibold text-slate-900", className)} {...props} />
);

const SheetDescription = ({ className, ...props }: SheetPrimitive.DialogDescriptionProps) => (
  <SheetPrimitive.Description className={cn("text-sm text-slate-500", className)} {...props} />
);

export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription };
