"use client";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-white group-[.toaster]:border-2 group-[.toaster]:border-yellow-500 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-slate-300",
          actionButton: "group-[.toast]:bg-blue-600 group-[.toast]:text-white group-[.toast]:font-bold group-[.toast]:px-4 group-[.toast]:py-2",
          cancelButton: "group-[.toast]:bg-slate-700 group-[.toast]:text-slate-200 group-[.toast]:font-bold group-[.toast]:px-4 group-[.toast]:py-2",
        },
        style: {
          fontSize: '16px',
          padding: '16px',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
