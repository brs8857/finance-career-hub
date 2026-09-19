import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary: "border border-border bg-surface text-fg hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-fg",
  danger: "text-down hover:bg-surface-2",
};

export function buttonClasses(variant: Variant = "secondary", size: "sm" | "md" = "md") {
  const sizing = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return `inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${sizing} ${VARIANTS[variant]}`;
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: "sm" | "md" }) {
  // React 19 passes `ref` through as a normal prop, so it reaches <button> via ...rest.
  return <button type={type} className={`${buttonClasses(variant, size)} ${className}`} {...rest} />;
}
