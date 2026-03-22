import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface FieldTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

interface FieldSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const FieldInput = forwardRef<HTMLInputElement, FieldInputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <input
        ref={ref}
        className={cn(
          "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none",
          "focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all",
          "placeholder:text-gray-400 bg-white",
          error && "border-red-300 focus:border-red-400 focus:ring-red-100",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
FieldInput.displayName = "FieldInput";

export const FieldTextarea = forwardRef<HTMLTextAreaElement, FieldTextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <textarea
        ref={ref}
        rows={3}
        className={cn(
          "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none",
          "focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all",
          "placeholder:text-gray-400 bg-white resize-none",
          error && "border-red-300",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
FieldTextarea.displayName = "FieldTextarea";

export const FieldSelect = forwardRef<HTMLSelectElement, FieldSelectProps>(
  ({ label, error, className, children, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <select
        ref={ref}
        className={cn(
          "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none",
          "focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all",
          "bg-white text-gray-700",
          error && "border-red-300",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
FieldSelect.displayName = "FieldSelect";