import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrailleCell from "@/components/BrailleCell";
import BRAILLE_MAP, { type BrailleDots } from "@/lib/brailleMap";

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

const LearnPage = () => {
  const [mode, setMode] = useState<"explore" | "quiz">("explore");
  const [quizIdx, setQuizIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);

  const currentLetter = alphabet[quizIdx % alphabet.length];
  const options = getOptions(currentLetter);

  function getOptions(correct: string) {
    const others = alphabet.filter((l) => l !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return [correct, ...others].sort(() => Math.random() - 0.5);
  }

  const answer = (choice: string) => {
    if (answered) return;
    setAnswered(choice);
    if (choice === currentLetter) setScore((s) => s + 1);
    setTimeout(() => {
      setAnswered(null);
      setQuizIdx((i) => i + 1);
    }, 1200);
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold mb-2">Learn Braille</h1>
          <p className="text-muted-foreground mb-6">Explore the alphabet or test your knowledge with interactive quizzes.</p>
        </motion.div>

        <div className="flex gap-2 mb-8">
          <Button variant={mode === "explore" ? "default" : "outline"} onClick={() => setMode("explore")}>
            <GraduationCap className="w-4 h-4 mr-2" /> Alphabet
          </Button>
          <Button variant={mode === "quiz" ? "default" : "outline"} onClick={() => { setMode("quiz"); setScore(0); setQuizIdx(0); }}>
            Quiz Mode
          </Button>
        </div>

        {mode === "explore" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-4">
            {alphabet.map((letter, i) => (
              <motion.div
                key={letter}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex flex-col items-center"
              >
                <BrailleCell dots={BRAILLE_MAP[letter]} label={letter.toUpperCase()} size="md" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {mode === "quiz" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center">
            <p className="text-sm text-muted-foreground mb-2">Question {quizIdx + 1} · Score: {score}</p>
            <div className="glass-card p-8 mb-6">
              <p className="text-sm text-muted-foreground mb-4">Which letter is this?</p>
              <div className="flex justify-center">
                <BrailleCell dots={BRAILLE_MAP[currentLetter]} size="lg" animated />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {options.map((opt) => (
                <Button
                  key={opt}
                  variant="outline"
                  size="lg"
                  className={`text-xl font-mono ${
                    answered === opt
                      ? opt === currentLetter
                        ? "border-primary bg-primary/10"
                        : "border-destructive bg-destructive/10"
                      : ""
                  }`}
                  onClick={() => answer(opt)}
                >
                  {opt.toUpperCase()}
                  {answered === opt && opt === currentLetter && <CheckCircle className="w-4 h-4 ml-2 text-primary" />}
                  {answered === opt && opt !== currentLetter && <XCircle className="w-4 h-4 ml-2 text-destructive" />}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LearnPage;
