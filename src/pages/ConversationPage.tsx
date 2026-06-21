import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BrailleCell from "@/components/BrailleCell";
import { textToBraille, dotsToUnicode } from "@/lib/brailleMap";

interface Message {
  id: number;
  text: string;
  from: "sighted" | "braille";
}

const ConversationPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"sighted" | "braille">("sighted");

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), text: input.trim(), from: mode }]);
    setInput("");
  };

  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(u);
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold mb-2">Conversation Mode</h1>
          <p className="text-muted-foreground mb-6">Two-way chat: sighted user types text, Braille user sees dots & hears speech.</p>
        </motion.div>

        <div className="flex gap-2 mb-4">
          <Button variant={mode === "sighted" ? "default" : "outline"} size="sm" onClick={() => setMode("sighted")}>
            Sighted User
          </Button>
          <Button variant={mode === "braille" ? "default" : "outline"} size="sm" onClick={() => setMode("braille")}>
            Braille User
          </Button>
        </div>

        <div className="glass-card p-4 min-h-[400px] max-h-[500px] overflow-y-auto mb-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-20">No messages yet. Start typing below.</p>
          )}
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.from === "sighted" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-3 ${m.from === "sighted" ? "bg-primary/10" : "bg-muted"}`}>
                <p className="text-sm mb-1">{m.text}</p>
                <div className="flex flex-wrap gap-1">
                  {textToBraille(m.text).map((c, i) => (
                    <BrailleCell key={i} dots={c.dots} size="sm" />
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs" onClick={() => speak(m.text)}>
                  <Volume2 className="w-3 h-3 mr-1" /> Listen
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1" />
          <Button type="submit"><Send className="w-4 h-4" /></Button>
        </form>
      </div>
    </div>
  );
};

export default ConversationPage;
