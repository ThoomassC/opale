/* Vendored from react-magic-ui — MIT, Copyright (c) 2025 tweeedlex.
   https://github.com/tweeedlex/react-magic-ui
   Kept byte-faithful on purpose: this file is NOT covered by Opale's colour
   contract and is not styled with Opale's tokens. See src/magic/README.md. */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- écart assumé au profit de la fidélité.
   Défaut réel de leur `Checkbox`, gardé tel quel : le libellé est un `<span>`
   avec `onClick`, et non un `<label>`. Cliquer le libellé marche à la souris,
   pas au clavier. À corriger en amont chez tweeedlex. */

import React from "react";
import styles from "./style/Checkbox.module.scss";
import clsx from "clsx";
import Glass, { type GlassProps } from "../glass/Glass";

export type CheckboxProps = {
    disabled?: boolean;
    size?: "small" | "medium" | "large";
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    label?: string;
    enableClickAnimation?: boolean;
} & GlassProps;

const Checkbox: React.FC<CheckboxProps> = ({
    size = "medium",
    disabled,
    checked = false,
    onChange,
    label,
    enableClickAnimation = true,
    ...props
}) => {
    const toggle = () => {
        if (!disabled && onChange) {
            onChange(!checked);
        }
    };

    return (
        <div
            className={clsx(
                styles.checkboxContainer,
                disabled && styles.disabled
            )}
        >
            <Glass
                enableLiquidAnimation={enableClickAnimation}
                as="button"
                type="button"
                onClick={toggle}
                className={clsx(
                    styles.checkbox,
                    styles[size],
                    checked && styles.checked,
                    disabled && styles.disabled
                )}
                rootClassName={clsx(
                    styles.glassRoot,
                    styles[size]
                )}
                disabled={disabled}
                {...props}
            >
                {checked && (
                    <svg
                        className={clsx(styles.checkIcon, "pointer-events-none")}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M20 6L9 17L4 12"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </Glass>
            {label && (
                <span className={styles.label} onClick={toggle}>
                    {label}
                </span>
            )}
        </div>
    );
};

export default Checkbox;
