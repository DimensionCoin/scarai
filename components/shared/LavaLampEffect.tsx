"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { memo } from "react";

interface LavaLampFluidLogoProps {
  size?: number;
  containerStyle?: React.CSSProperties;
}

function LavaLampEffectComponent({
  size = 200,
  containerStyle,
}: LavaLampFluidLogoProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const randomBetween = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    if (!svgRef.current) return;

    // GSAP context to scope animations to this SVG
    const ctx = gsap.context(() => {
      // Set initial properties
      for (let i = 0; i < 7; i++) {
        const blob = svgRef.current?.querySelector(`#blob${i}`);
        if (blob) {
          gsap.set(blob, {
            scale: 1.4,
            transformOrigin: "50% 50%",
            x: 0,
            y: 0,
          });
        }
      }

      // Animate blobs
      for (let i = 0; i < 7; i++) {
        const blob = svgRef.current?.querySelector(`#blob${i}`);
        if (blob) {
          gsap.to(blob, {
            duration: () => randomBetween(3, 6),
            x: () => randomBetween(-60, 60),
            y: () => randomBetween(-60, 60),
            scale: () => 1.4 * randomBetween(0.75, 1.25),
            rotation: () => randomBetween(-20, 20),
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            delay: i * 0.2,
          });
        }
      }
    }, svgRef);

    // Cleanup: Kill animations when unmounted
    return () => {
      ctx.revert(); // Cleans up all GSAP animations in this context
    };
  }, []); // Empty array: runs once per mount

  return (
    <div
      style={{
        width: size,
        height: size,
        ...containerStyle,
      }}
    >
      <svg
        ref={svgRef}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="150 50 300 300"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0   0 1 0 0 0   0 0 1 0 0   0 0 0 21 -9"
            />
          </filter>
          <radialGradient
            id="blob0_2_"
            cx="300"
            cy="200"
            r="56.5354"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.0102" style={{ stopColor: "#0EA5E9" }} />
            <stop offset="1" style={{ stopColor: "#075985" }} />
          </radialGradient>
          <radialGradient
            id="blob1_2_"
            cx="300"
            cy="200"
            r="37.2156"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.0102" style={{ stopColor: "#0EA5E9" }} />
            <stop offset="1" style={{ stopColor: "#075985" }} />
          </radialGradient>
          <radialGradient
            id="blob2_2_"
            cx="300"
            cy="200"
            r="23"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.0102" style={{ stopColor: "#0EA5E9" }} />
            <stop offset="1" style={{ stopColor: "#075985" }} />
          </radialGradient>
          <radialGradient
            id="blob3_2_"
            cx="300"
            cy="200"
            r="41.0767"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.0102" style={{ stopColor: "#0EA5E9" }} />
            <stop offset="1" style={{ stopColor: "#075985" }} />
          </radialGradient>
          <radialGradient
            id="blob4_2_"
            cx="300"
            cy="200"
            r="14.109"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.0102" style={{ stopColor: "#0EA5E9" }} />
            <stop offset="1" style={{ stopColor: "#075985" }} />
          </radialGradient>
          <radialGradient
            id="blob5_2_"
            cx="300"
            cy="200"
            r="30"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.0102" style={{ stopColor: "#0EA5E9" }} />
            <stop offset="1" style={{ stopColor: "#075985" }} />
          </radialGradient>
          <radialGradient
            id="blob6_2_"
            cx="300"
            cy="200"
            r="20"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.0102" style={{ stopColor: "#0EA5E9" }} />
            <stop offset="1" style={{ stopColor: "#075985" }} />
          </radialGradient>
        </defs>
        <g filter="url(#goo)">
          <path
            id="blob0"
            fill="url(#blob0_2_)"
            d="M326.2,199.5c-5,19.2-21.4,29.2-37.8,26.6c-16.5-2.9-33.4-12.9-37.1-26.6
              c-3.8-13.6,12.5-32.1,37.8-34.9C314.4,161.8,331.3,180.4,326.2,199.5z"
          />
          <path
            id="blob1"
            fill="url(#blob1_2_)"
            d="M320.5,196.4c-4.4,10.1-16.4,20.2-26.8,25.3c-10.4,5.2-22.4-2.9-26.8-15.2
              c-4.4-11.6,7.6-20.4,26.8-25.3C312.9,176.3,324.9,185.6,320.5,196.4z"
          />
          <path
            id="blob2"
            fill="url(#blob2_2_)"
            d="M278,197.7c2.7-7.1,9.4-15.7,15.4-16.4c5.9-0.4,12.6,8.5,15.4,16.9
              c2.7,8.4-4.2,14.9-15.4,14.2C282.2,211.5,275.3,204.8,278,197.7z"
          />
          <path
            id="blob3"
            fill="url(#blob3_2_)"
            d="M312.7,197.3c-2.1,16.4-15.3,27.2-23.2,25.3c-8.1-1.8-12.6-13-14.8-24.9
              c-1.9-11.8,2.7-22.7,14.8-25.3C301.5,169.6,314.7,180.8,312.7,197.3z"
          />
          <path
            id="blob4"
            fill="url(#blob4_2_)"
            d="M317.8,197.4c-1,8.2-9.8,10.3-13.8,9.3c-4-0.9-6.5-3-7.6-8.9c-1-5.9,2.3-8.5,8.4-9.8
              C310.8,186.6,318.8,189.1,317.8,197.4z"
          />
          <path
            id="blob5"
            fill="url(#blob5_2_)"
            d="M310,205c-5,5-15,10-20,5s-5-15,0-20c5-5,15-5,20,0S315,200,310,205z"
          />
          <path
            id="blob6"
            fill="url(#blob6_2_)"
            d="M305,195c-4,4-10,8-15,4s-4-10,0-14c4-4,10-4,15,0S309,191,305,195z"
          />
        </g>
      </svg>
    </div>
  );
}

export default memo(LavaLampEffectComponent, (prevProps, nextProps) => {
  return (
    prevProps.size === nextProps.size &&
    JSON.stringify(prevProps.containerStyle) ===
      JSON.stringify(nextProps.containerStyle)
  );
});
