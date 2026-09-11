/* Vendored from react-magic-ui — MIT, Copyright (c) 2025 tweeedlex.
   https://github.com/tweeedlex/react-magic-ui
   Kept byte-faithful on purpose: this file is NOT covered by Opale's colour
   contract and is not styled with Opale's tokens. See src/magic/README.md. */

import React, { type ComponentPropsWithoutRef } from "react";
import { cn } from "../../func";
import Glass from "../glass/Glass";
import styles from "./style/Input.module.scss";

export type InputProps = Omit<ComponentPropsWithoutRef<"input">, "size"> & {
  size?: "small" | "medium" | "large";
  enableClickAnimation?: boolean;
};

const Input: React.FC<InputProps> = ({
  size = "medium",
  disabled,
  onChange,
  placeholder,
  enableClickAnimation = true,
  ...props
}) => {
  return (
    <Glass enableLiquidAnimation={enableClickAnimation}>
      <input
        type="text"
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          styles.input,
          styles[size],
          disabled ? styles.disabled : ""
        )}
        {...props}
      />
    </Glass>
  );
};

export default Input;
