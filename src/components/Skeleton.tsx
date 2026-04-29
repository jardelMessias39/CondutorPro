"use client";

import { ReactNode } from "react";

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ 
  width = "100%", 
  height = "20px", 
  borderRadius = "8px",
  className = "",
  style
}: SkeletonProps) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-pulse 1.5s ease-in-out infinite",
        ...style
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div style={{
      padding: "30px",
      border: "1px solid var(--border)",
      borderRadius: "15px",
      background: "var(--card-bg)"
    }}>
      <Skeleton height="24px" width="60%" />
      <div style={{ marginTop: "15px" }}>
        <Skeleton height="16px" width="100%" />
        <Skeleton height="16px" width="80%" style={{ marginTop: "8px" }} />
      </div>
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <Skeleton height="40px" width="100px" borderRadius="8px" />
        <Skeleton height="40px" width="100px" borderRadius="8px" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          height="16px" 
          width={i === lines - 1 ? "60%" : "100%"} 
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ 
      border: "1px solid var(--border)", 
      borderRadius: "15px", 
      overflow: "hidden" 
    }}>
      <div style={{ 
        display: "flex", 
        padding: "15px", 
        background: "rgba(255,255,255,0.05)",
        borderBottom: "1px solid var(--border)"
      }}>
        <Skeleton height="16px" width="25%" />
        <Skeleton height="16px" width="25%" />
        <Skeleton height="16px" width="25%" />
        <Skeleton height="16px" width="25%" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ 
          display: "flex", 
          padding: "15px",
          borderBottom: "1px solid var(--border)"
        }}>
          <Skeleton height="16px" width="25%" />
          <Skeleton height="16px" width="25%" />
          <Skeleton height="16px" width="25%" />
          <Skeleton height="16px" width="25%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ columns = 3, rows = 2 }: { columns?: number; rows?: number }) {
  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: "20px"
    }}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}