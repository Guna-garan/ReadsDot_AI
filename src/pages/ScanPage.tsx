import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

import { loadModel, type ModelSession, type Detection } from "@/ml/modelLoader";
import { preprocess, classIdToBraille, translateBrailleToEnglish } from "@/ml/brailleUtils";

const MODEL_PATH = "/models/yolov8n-braille.onnx";
const INPUT_DIM = 640;

// This function now uses the real ONNX model to analyze the image
const analyzeImageWithModel = async (session: ModelSession, imageSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = async () => {
      try {
        const input = await preprocess(img, INPUT_DIM, INPUT_DIM, false);
        const detections = await session.run(input, INPUT_DIM, INPUT_DIM);

        if (detections.length === 0) {
          resolve("No Braille characters were detected in this image.");
          return;
        }

        // Sort detections by Y primarily (for lines) and then X (for reading order)
        // Use a 20 pixel threshold for "same line" detection
        const sorted = detections.sort((a, b) => {
          if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
          return a.x - b.x;
        });

        const brailleChars = sorted.map(d => classIdToBraille(d.classId)).join("");
        const englishTranslation = translateBrailleToEnglish(brailleChars);

        resolve(englishTranslation || "Detected patterns but could not translate to English.");
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
  });
};

const ScanPage = () => {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [session, setSession] = useState<ModelSession | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load the model on scan page mount
  useEffect(() => {
    async function init() {
      try {
        const loadedSession = await loadModel(MODEL_PATH);
        setSession(loadedSession);
      } catch (err) {
        console.error("Failed to load model on scan page", err);
      }
    }
    init();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG).",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setExtractedText(""); // Clear previous text
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!imagePreview) return;

    setIsProcessing(true);
    setExtractedText("");

    try {
      if (!session) throw new Error("Model session not ready");

      const result = await analyzeImageWithModel(session, imagePreview);
      setExtractedText(result);

      toast({
        title: "Scan Complete",
        description: "Successfully translated Braille from the image.",
      });
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "An error occurred while analyzing the image.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setExtractedText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadPDF = () => {
    if (!extractedText) return;

    // Using jsPDF to generate a PDF document
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("ReadsDot AI - Scan Report", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const splitText = doc.splitTextToSize(extractedText, 170);
    doc.text(splitText, 20, 35);

    doc.save("Braille-Translation.pdf");

    toast({
      title: "Export Successful",
      description: "PDF has been downloaded to your device.",
    });
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold mb-2">Full Page Document Scan</h1>
          <p className="text-muted-foreground mb-8">
            Upload or capture an entire Braille page for structured text conversion.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-1 mb-6"
        >
          <div className="aspect-[4/3] md:aspect-video bg-muted rounded-xl flex flex-col items-center justify-center gap-4 relative overflow-hidden">

            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="Uploaded document"
                  className="w-full h-full object-contain p-2"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-4 right-4 rounded-full"
                  onClick={clearImage}
                >
                  <X className="w-4 h-4" />
                </Button>

                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button
                    onClick={processImage}
                    disabled={isProcessing}
                    className="shadow-lg min-w-[150px]"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                    ) : (
                      <><FileText className="w-4 h-4 mr-2" /> Start Translation</>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-16 h-16 text-muted-foreground/40 mb-2" />
                <p className="text-muted-foreground text-sm px-4 text-center">
                  Drag & drop an image or click to upload
                </p>
                <div className="flex gap-3 mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" /> Upload Image
                  </Button>
                </div>
              </>
            )}

          </div>
        </motion.div>

        <div className="glass-card p-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 gap-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Extracted Text
            </h3>
            <Button
              variant="outline"
              disabled={!extractedText || isProcessing}
              onClick={downloadPDF}
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" /> Export as PDF
            </Button>
          </div>

          <div className={`min-h-[120px] rounded-lg p-5 font-mono text-sm break-words whitespace-pre-wrap ${extractedText ? "bg-primary/5 text-foreground" : "bg-muted/50 text-muted-foreground"}`}>
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-[120px] text-primary">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Processing with AI Model...</p>
              </div>
            ) : (
              extractedText || "No document scanned yet..."
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ScanPage;
