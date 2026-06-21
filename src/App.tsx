import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import TranslatePage from "./pages/TranslatePage";
import TextToBraillePage from "./pages/TextToBraillePage";
import ConversationPage from "./pages/ConversationPage";
import LearnPage from "./pages/LearnPage";
import ScanPage from "./pages/ScanPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/translate" element={<TranslatePage />} />
          <Route path="/text-to-braille" element={<TextToBraillePage />} />
          <Route path="/conversation" element={<ConversationPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
