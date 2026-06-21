import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Camera, Type, MessageSquare, GraduationCap, FileText,
  Wifi, WifiOff, Shield, Smartphone, Eye, Zap, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/FeatureCard";
import BrailleShowcase from "@/components/BrailleShowcase";

const features = [
  { icon: Camera, title: "Real-time Detection", description: "Point your camera at Braille text and get instant translation using on-device YOLO detection." },
  { icon: Type, title: "Text → Braille", description: "Convert any typed text into visual Braille dot patterns with Grade-1 and Grade-2 support." },
  { icon: MessageSquare, title: "Conversation Mode", description: "Two-way chat between Braille and sighted users with speech integration." },
  { icon: GraduationCap, title: "Learn Braille", description: "Interactive alphabet trainer with quizzes and gamified lessons." },
  { icon: FileText, title: "Document Scan", description: "Capture full Braille pages and convert to structured text with PDF export." },
  { icon: WifiOff, title: "Fully Offline", description: "Everything runs locally on your device. No internet, no cloud, complete privacy." },
  { icon: Shield, title: "Privacy First", description: "Images and data never leave your device. Zero tracking, zero uploads." },
  { icon: Smartphone, title: "Smart Detection", description: "Auto-detects surface type—paper, plastic, medicine strips, elevator panels." },
];

const Index = () => (
  <div className="min-h-screen">
    {/* Hero */}
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            100% On-Device · No Cloud Required
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
            <span className="hero-gradient-text">ReadsDot AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-light">
            Real-time Braille detection, translation & learning—powered by AI, running entirely on your device.
          </p>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Point your camera at any Braille text and hear it spoken aloud. Convert text to Braille. Learn the alphabet. All offline, all private.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base px-8 glow-primary">
              <Link to="/translate">
                <Camera className="w-5 h-5 mr-2" /> Start Translating
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8">
              <Link to="/learn">
                <GraduationCap className="w-5 h-5 mr-2" /> Learn Braille
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Braille showcase */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-20"
        >
          <p className="text-center text-sm text-muted-foreground mb-4 font-mono">"hello" in Braille</p>
          <BrailleShowcase />
        </motion.div>
      </div>
    </section>

    {/* Features */}
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Everything you need, <span className="hero-gradient-text">nothing in the cloud</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A complete Braille toolkit running 100% on your device with state-of-the-art ML models.
          </p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-10 md:p-16 text-center max-w-3xl mx-auto"
        >
          <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-display font-bold mb-4">Ready to bridge the gap?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Start using BrailleVision today. No sign-up, no downloads beyond this page, no internet required.
          </p>
          <Button asChild size="lg" className="glow-primary px-10">
            <Link to="/translate">Get Started</Link>
          </Button>
        </motion.div>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t border-border py-8 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-display font-semibold text-foreground">
          <Eye className="w-4 h-4 text-primary" />
          ReadsDot AI
        </div>
        <p>100% offline · Privacy-preserving · Open accessibility</p>
      </div>
    </footer>
  </div>
);

export default Index;
