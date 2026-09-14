/* Vendored from react-magic-ui — MIT, Copyright (c) 2025 tweeedlex.
   https://github.com/tweeedlex/react-magic-ui
   Kept byte-faithful on purpose: this file is NOT covered by Opale's colour
   contract and is not styled with Opale's tokens. See src/magic/README.md. */
/* eslint-disable @typescript-eslint/no-unused-vars, jsx-a11y/no-static-element-interactions -- écart assumé au profit de la fidélité.
   Deux défauts réels de leur `Slider`, gardés tels quels :
   - `showValue` est déstructuré mais jamais lu : cette prop n'a aucun effet ;
   - la piste est un `<div>` sans rôle, sans tabindex et sans clavier.
   La surface Glass est ajoutée par Opale pour aligner ce dernier composant sur
   le matériau liquide commun. Seule la poignée se déplace après une prise en
   main, en continu à l'écran, même lorsque `step` arrondit la valeur émise.
   À corriger en amont chez tweeedlex, pas par une divergence locale. */

import React, { useState, useRef, type PointerEvent } from "react";
import styles from "./style/Slider.module.scss";
import clsx from "clsx";
import Glass from "../glass/Glass";

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
    const [dragPercentage, setDragPercentage] = useState<number | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    const displayedPercentage = dragPercentage ?? percentage;

    const updateValue = (clientX: number) => {
        if (!sliderRef.current || disabled) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const width = rect.width;
        let newPercentage = (offsetX / width) * 100;

        // Clamp percentage between 0 and 100
        newPercentage = Math.max(0, Math.min(100, newPercentage));
        setDragPercentage(newPercentage);

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

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (disabled) return;

        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        updateValue(e.clientX);
    };

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (isDragging && !disabled) {
            updateValue(e.clientX);
        }
    };

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        setIsDragging(false);
        setDragPercentage(null);
    };

    return (
        <Glass
            rootStyle={{ width: "100%" }}
            enableLiquidAnimation={!disabled && enableClickAnimation}
            {...props}
            className={clsx(styles.sliderContainer, styles[size], disabled && styles.disabled)}
        >
            <div ref={sliderRef} className={clsx(styles.sliderTrack, styles[size])}>
                <div className={clsx(styles.trackBackground, styles[size])}>
                    <div
                        className={styles.trackFill}
                        style={{ width: `${displayedPercentage}%` }}
                    />
                </div>
                <div
                    className={clsx(styles.thumb, isDragging && styles.dragging)}
                    style={{ left: `${displayedPercentage}%` }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                />
            </div>
        </Glass>
    );
};

export default Slider;
