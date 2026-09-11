/* Vendored from react-magic-ui — MIT, Copyright (c) 2025 tweeedlex.
   https://github.com/tweeedlex/react-magic-ui
   Kept byte-faithful on purpose: this file is NOT covered by Opale's colour
   contract and is not styled with Opale's tokens. See src/magic/README.md. */
/* eslint-disable @typescript-eslint/no-explicit-any -- écart assumé au profit de la fidélité.
   Leur `Glass` est polymorphe (`as`) et type sa ref et son événement de clic
   en `any`. Le corriger demanderait de retyper tout le composant : c'est un
   changement d'API, pas une mise en conformité. Règle neutralisée ici pour ne
   pas rendre `npm run lint` rouge sur du code volontairement gardé fidèle. */

import styles from "./style/Glass.module.scss";
import React, {
  forwardRef,
  type ElementType,
  type ComponentPropsWithoutRef,
  useState,
  useRef,
  useCallback,
} from "react";
import clsx from "clsx";

export type GlassProps<T extends ElementType = "div"> = {
  as?: T;
  children?: React.ReactNode;
  rootClassName?: string;
  rootStyle?: React.CSSProperties;
  enableLiquidAnimation?: boolean;
  triggerAnimation?: boolean;
} & ComponentPropsWithoutRef<T>;

const Glass = forwardRef(
  <T extends ElementType = "div">(
    { as, children, className, rootClassName, rootStyle, enableLiquidAnimation = false, triggerAnimation = false, onClick, ...props }: GlassProps<T>,
    ref: React.ForwardedRef<any>,
  ) => {
    const Component = as || "div";
    const [isAnimating, setIsAnimating] = useState(false);
    const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleClick = useCallback((event: React.MouseEvent<any>) => {
      if (enableLiquidAnimation && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        setRipplePosition({ x, y });
        setIsAnimating(true);

        setTimeout(() => setIsAnimating(false), 800);
      }

      if (onClick) {
        onClick(event);
      }
    }, [enableLiquidAnimation, onClick]);

    // Handle programmatic animation trigger (independent of enableLiquidAnimation)
    React.useEffect(() => {
      if (triggerAnimation) {
        // Center the ripple for programmatic triggers
        setRipplePosition({ x: 50, y: 50 });
        setIsAnimating(true);

        const timer = setTimeout(() => setIsAnimating(false), 800);
        return () => clearTimeout(timer);
      }
    }, [triggerAnimation]);

    return (
      <>
        <svg style={{ display: "none" }}>
          <filter id="lg-dist" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.005 0.005"
              numOctaves="5"
              seed="92"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurred"
              scale="80"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>

        <div
          ref={containerRef}
          className={clsx(
            styles.glassContainer,
            rootClassName,
            isAnimating && styles.glassAnimating
          )}
          style={rootStyle}
        >
          <div className={clsx(styles.glassFilter, isAnimating && styles.glassFilterAnimate)}></div>
          <div className={styles.glassOverlay}></div>
          <div className={styles.glassSpecular}></div>
          {isAnimating && (
            <div
              className={styles.glassRipple}
              style={{
                left: `${ripplePosition.x}%`,
                top: `${ripplePosition.y}%`,
              }}
            />
          )}
          <Component
            {...props}
            ref={ref}
            onClick={handleClick}
            className={clsx(styles.glassContent, className)}
          >
            {children}
          </Component>
        </div>
      </>
    );
  },
);

Glass.displayName = "Glass";

export default Glass;
