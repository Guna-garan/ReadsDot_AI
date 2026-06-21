import { motion } from "framer-motion";
import BrailleCell from "./BrailleCell";
import { textToBraille } from "@/lib/brailleMap";

const BrailleShowcase = () => {
  const word = "hello";
  const cells = textToBraille(word);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="flex items-center gap-3 justify-center"
    >
      {cells.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <BrailleCell dots={c.dots} label={c.char} size="lg" animated />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default BrailleShowcase;
