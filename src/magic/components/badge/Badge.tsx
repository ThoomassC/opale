/* Vendored from react-magic-ui — MIT, Copyright (c) 2025 tweeedlex.
   https://github.com/tweeedlex/react-magic-ui
   Kept byte-faithful on purpose: this file is NOT covered by Opale's colour
   contract and is not styled with Opale's tokens. See src/magic/README.md. */

import React from "react";
import clsx from "clsx";
import styles from "./style/Badge.module.scss";
import Glass, { type GlassProps } from "../glass/Glass";

export type BadgeVariant =
  | "default"
  | "positive"
  | "negative"
  | "warning"
  | "info"
  | "neutral";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
} & GlassProps;

const variantBackground = {
  default: "",
  positive: "bg-positive",
  negative: "bg-negative",
  warning: "bg-warning",
  info: "bg-info",
  neutral: "bg-neutral",
} as const;

const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "default",
  leadingIcon,
  trailingIcon,
  ...props
}) => {
  return (
    <Glass
      as="span"
      className={clsx(
        styles.badge,
        variantBackground[variant],
        className,
      )}
      rootClassName={"rounded-full"}
      {...props}
    >
      {leadingIcon && <span className={styles.badge__icon}>{leadingIcon}</span>}
      {children}
      {trailingIcon && <span className={styles.badge__icon}>{trailingIcon}</span>}
    </Glass>
  );
};

export default Badge;

