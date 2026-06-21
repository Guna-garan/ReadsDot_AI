import { type BrailleDots } from "@/lib/brailleMap";
import { motion } from "framer-motion";

interface BrailleCellProps {
  dots: BrailleDots;
  label?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

const sizeMap = {
  sm: { dot: "w-2.5 h-2.5", gap: "gap-1", padding: "p-1.5" },
  md: { dot: "w-4 h-4", gap: "gap-1.5", padding: "p-2" },
  lg: { dot: "w-5 h-5", gap: "gap-2", padding: "p-3" },
};

const BrailleCell = ({ dots, label, size = "md", animated = false }: BrailleCellProps) => {
  const s = sizeMap[size];
  // Dot order in grid: [0,3] [1,4] [2,5] (rows: top, mid, bot; cols: left, right)
  const gridDots = [dots[0], dots[3], dots[1], dots[4], dots[2], dots[5]];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`braille-cell inline-grid grid-cols-2 ${s.gap} ${s.padding}`}>
        {gridDots.map((active, i) => {
          const Comp = animated ? motion.div : "div";
          const animProps = animated && active
            ? { animate: { scale: [1, 1.2, 1] }, transition: { duration: 0.4, delay: i * 0.05 } }
            : {};
          return (
            <Comp
              key={i}
              className={`${s.dot} rounded-full ${active ? "braille-dot-active" : "braille-dot-inactive"}`}
              {...animProps}
            />
          );
        })}
      </div>
      {label && (
        <span className="text-xs font-mono text-muted-foreground">{label}</span>
      )}
    </div>
  );
};

export default BrailleCell;
