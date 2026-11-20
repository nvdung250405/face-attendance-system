import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideCloseButton?: boolean;
    usePortal?: boolean;
    /** Trên mobile (<640px) modal tự động chuyển thành Bottom Sheet trượt lên từ dưới */
    mobileSheet?: boolean;
  }
>(
  (
    {
      className,
      children,
      hideCloseButton = false,
      usePortal = true,
      mobileSheet = true,
      ...props
    },
    ref,
  ) => {
    const content = (
      <>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            // Desktop: modal nổi giữa màn hình
            "fixed z-50 w-full bg-white shadow-2xl",
            "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
            // Desktop ≥ sm (640px): căn giữa, bo góc 2 chiều, max-width 512px
            "sm:left-[50%] sm:top-[50%] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%]",
            "sm:grid sm:gap-4 sm:rounded-2xl sm:border sm:border-slate-200 sm:p-6",
            "sm:max-h-[calc(100vh-4rem)] sm:overflow-y-auto",
            "data-[state=closed]:sm:fade-out-0 data-[state=open]:sm:fade-in-0",
            "data-[state=closed]:sm:zoom-out-95 data-[state=open]:sm:zoom-in-95",
            // Mobile < sm: Bottom Sheet (nếu mobileSheet=true)
            mobileSheet && [
              // Dán sát đáy, full-width, bo góc trên
              "max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto",
              "max-sm:inset-x-0 max-sm:w-full max-sm:max-w-none",
              "max-sm:rounded-t-2xl max-sm:rounded-b-none",
              "max-sm:border-t max-sm:border-slate-200",
              "max-sm:p-4 max-sm:pb-safe",
              "max-sm:max-h-[90dvh] max-sm:overflow-y-auto",
              // Slide-up / slide-down animation
              "data-[state=open]:max-sm:slide-in-from-bottom-full",
              "data-[state=closed]:max-sm:slide-out-to-bottom-full",
            ],
            // Không dùng Bottom Sheet: vẫn center như desktop
            !mobileSheet && [
              "max-sm:left-[50%] max-sm:top-[50%] max-sm:translate-x-[-50%] max-sm:translate-y-[-50%]",
              "max-sm:rounded-2xl max-sm:border max-sm:border-slate-200 max-sm:p-5",
              "max-sm:max-h-[calc(100vh-2rem)] max-sm:overflow-y-auto",
            ],
            className,
            // Đảm bảo mobileSheet trên thiết bị di động (<sm) luôn tràn viền full width và không bị giới hạn max-width từ className
            mobileSheet && "max-sm:inset-x-0 max-sm:w-full max-sm:max-w-none",
          )}
          {...props}
        >
          {/* Drag handle indicator chỉ hiện khi là Bottom Sheet trên mobile */}
          {mobileSheet && (
            <div
              aria-hidden="true"
              className="sm:hidden mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 shrink-0"
            />
          )}
          {children}
          {!hideCloseButton && (
            <DialogPrimitive.Close
              aria-label="Đóng"
              className="absolute right-3.5 top-3.5 rounded-xl p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <X size={18} strokeWidth={2} />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </>
    );

    if (!usePortal) {
      return content;
    }

    return <DialogPortal>{content}</DialogPortal>;
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-bold leading-none tracking-tight text-slate-900",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-slate-500", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
