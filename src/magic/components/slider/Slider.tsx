/* Vendored from react-magic-ui — MIT, Copyright (c) 2025 tweeedlex.
   https://github.com/tweeedlex/react-magic-ui
   Kept byte-faithful on purpose: this file is NOT covered by Opale's colour
   contract and is not styled with Opale's tokens. See src/magic/README.md. */
/* eslint-disable @typescript-eslint/no-unused-vars, jsx-a11y/no-static-element-interactions -- écart assumé au profit de la fidélité.
   Deux défauts réels de leur `Slider`, gardés tels quels :
   - `showValue` et `enableClickAnimation` sont déstructurés mais jamais lus :
     ces deux props n'ont aucun effet ;
   - la piste est un `<div>` avec `onMouseDown`, sans rôle, sans tabindex et
     sans clavier : le curseur est inutilisable sans souris.
   À corriger en amont chez tweeedlex, pas par une divergence locale. */

import React, { useState, useRef, type MouseEvent } from "react";
import styles from "./style/Slider.module.scss";
import clsx from "clsx";

export type SliderProps = {
    disabled?: boolean;
    size?: "small" | "medium" | "large";
    min?: number;
    max?: number;
    step?: number;
    value?: number;
    onChange?: (value: number) => void;
    showValue?: boolean;
    enableClickAnimation?: boolean;
};

const Slider: React.FC<SliderProps> = ({
    size = "medium",
    disabled,
    min = 0,
    max = 100,
    step = 1,
    value = 50,
    onChange,
    showValue = false,
    enableClickAnimation = true,
    ...props
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    const percentage = ((value - min) / (max - min)) * 100;

    const updateValue = (clientX: number) => {
        if (!sliderRef.current || disabled) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const width = rect.width;
        let newPercentage = (offsetX / width) * 100;

        // Clamp percentage between 0 and 100
        newPercentage = Math.max(0, Math.min(100, newPercentage));

        // Calculate new value
        let newValue = min + (newPercentage / 100) * (max - min);

        // Apply step
        newValue = Math.round(newValue / step) * step;

        // Clamp value between min and max
        newValue = Math.max(min, Math.min(max, newValue));

        if (onChange && newValue !== value) {
            onChange(newValue);
        }
    };

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        setIsDragging(true);
        updateValue(e.clientX);
    };

    const handleMouseMove = (e: globalThis.MouseEvent) => {
        if (isDragging && !disabled) {
            updateValue(e.clientX);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            className={clsx(
                styles.sliderContainer,
                styles[size],
                disabled && styles.disabled
            )}
            {...props}
        >
            <div
                ref={sliderRef}
                className={clsx(styles.sliderTrack, styles[size])}
                onMouseDown={handleMouseDown}
            >
                <div className={clsx(styles.trackBackground, styles[size])}>
                    <div
                        className={styles.trackFill}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div
                    className={clsx(styles.thumb, isDragging && styles.dragging)}
                    style={{ left: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default Slider;
