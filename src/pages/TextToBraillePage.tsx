import { useState } from "react";
import { motion } from "framer-motion";
import { Type, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import BrailleCell from "@/components/BrailleCell";
import { textToBraille, dotsToUnicode } from "@/lib/brailleMap";

const TextToBraillePage = () => {
  const [text, setText] = useState("hello world");
  const cells = textToBraille(text);

  const exportJSON = () => {
    // Build the Unicode Braille string from the cells
    const brailleStr = cells.map((c) => dotsToUnicode(c.dots)).join("");
    // detectedText is the original input (uppercased to match the expected format)
    const payload = {
      detectedText: text.toUpperCase(),
      braille: brailleStr,
      confidence: 1.0,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "braille-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold mb-2">Text → Digital Braille</h1>
          <p className="text-muted-foreground mb-8">Type text below to see it rendered as Braille dot patterns.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something..."
              className="min-h-[150px] font-mono"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={exportJSON}
                disabled={!text.trim()}
                className="gap-2 border-violet-300 text-violet-700 hover:bg-violet-50 hover:border-violet-400 transition-all font-semibold"
              >
                <Download className="w-4 h-4" /> Export JSON
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" /> Braille Output
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {cells.map((c, i) => (
                <BrailleCell key={`${i}-${c.char}`} dots={c.dots} label={c.char} animated />
              ))}
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-1">Unicode Braille:</p>
              <p className="text-2xl font-mono tracking-widest">
                {cells.map((c) => dotsToUnicode(c.dots)).join("")}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TextToBraillePage;
