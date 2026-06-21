import { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera, Volume2, AlertCircle, CameraOff, RefreshCw,
  Copy, Trash2, FlipHorizontal, CheckCircle2, BookOpen, Type, SlidersHorizontal
} from "lucide-react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { loadModel, type ModelSession, type Detection } from "@/ml/modelLoader";
import { preprocess, classIdToChar, englishToBraille } from "@/ml/brailleUtils";

const MODEL_PATH = "/models/yolov8n-braille.onnx";
const INPUT_DIM = 640;
const BUFFER_SIZE = 10;  // Increased from 8 → more frames = better medoid stability

// ─── English word dictionary for fuzzy correction ───────────────────────────
const ENGLISH_WORDS = new Set([
  // 3-letter words
  "the","and","for","are","but","not","you","all","can","her","was","one",
  "our","out","day","get","has","him","his","how","man","men","new","now",
  "old","see","two","way","who","boy","did","its","let","put","say","she",
  "too","use","had","may","off","big","end","far","few","got","hot","job",
  "key","lay","led","leg","lot","low","map","met","nor","odd","oil","pay",
  "ran","red","run","set","six","ten","top","try","won","yes","yet",
  "dog","cat","cow","pig","hen","owl","fox","bat","rat","bee","ant","fly",
  "ape","elk","emu","gnu","yak","ram",
  "ago","aim","air","arm","art","ask","bad","bag","bar","bay","bed","bit",
  "box","bug","bus","buy","cut","dad","dot","dry","ear","eat","egg","eye",
  "fan","fat","fit","fix","fog","fun","gas","gum","gun","hat","hay","hit",
  "hop","hug","hut","ice","ill","jar","joy","jug","lab","lad","lip","log",
  "mad","mat","mob","mom","mud","mug","nap","net","nod","nun","nut","oar",
  "own","pad","pan","pat","paw","pea","pen","pet","pin","pit","pop","pot",
  "pub","rag","raw","ray","rib","rip","rob","rod","rot","row","rub","rug",
  "rum","sap","sky","sin","sip","sir","sob","sum","sun","tan","tap","tar",
  "tax","tin","tip","toe","ton","tow","toy","tug","tub","van","vat","vet",
  "vow","wax","web","wig","wit","yam","zip","zoo",
  // 4-letter words
  "help","love","life","time","good","here","know","look","make","much","name",
  "need","next","part","play","read","room","show","some","take","than","them",
  "then","they","this","told","turn","very","want","well","went","were","what",
  "when","will","with","work","your","from","give","hand","have","head","high",
  "home","just","keep","kind","last","left","like","line","live","long","more",
  "most","move","open","over","plan","come","back","call","care","case","city",
  "door","down","each","even","face","fact","feel","find","food","full","able",
  "area","base","best","book","both","days","done","draw","drop","else","ever",
  "eyes","fall","fast","feet","fill","fire","fish","free","gold","gone","grew",
  "grow","half","hard","hear","held","hold","hour","idea","into","join","king",
  "knew","land","late","lead","less","list","lose","lost","made","main","mark",
  "meet","mile","mind","mine","miss","note","once","only","page","past","path",
  "pick","pipe","poor","pull","push","rain","real","rest","rice","rich","ride",
  "ring","rise","road","rock","role","roll","roof","rule","safe","same","sand",
  "save","seat","self","sell","send","ship","side","sign","sing","site","size",
  "skin","soil","sold","song","soon","sort","soul","spot","star","stay","step",
  "stop","such","sure","swim","talk","tall","task","team","tear","tell","test",
  "text","thin","tide","till","tiny","toll","tone","tool","town","tree","true",
  "tube","used","view","vote","wait","walk","wall","warm","wash","wave","weak",
  "wear","week","west","wide","wife","wild","wind","wine","wing","wire","wise",
  "wish","wolf","wood","word","wore","worn","wrap","yard","year","zero","also",
  "army","aunt","axis","barn","bean","bear","beat","been","bell","belt","bend",
  "bird","bite","blow","blue","blur","bold","bolt","bond","bone","boom","boot",
  "bore","born","boss","buck","burn","cage","cake","calm","camp","cape","cave",
  "chip","chop","cite","coal","coat","code","coil","coin","cold","comb","cone",
  "cook","copy","cord","core","corn","cost","crew","crow","cube","curl","dare",
  "dark","dart","dash","data","dead","deaf","deal","dean","dear","debt","deck",
  "deed","deep","dent","deny","desk","diet","disc","dish","disk","dive","dock",
  "doll","dome","dose","dove","drag","drum","dual","duel","dune","dusk","dust",
  "earn","ease","edit","emit","epic","exam","exit","expo","fade","fake","fame",
  "fare","farm","fate","fern","flag","flaw","flea","flip","flog","flop","flow",
  "foam","fold","folk","fond","font","fool","ford","fore","fork","form","fort",
  "fowl","frog","fuel","fury","fuse","gale","gaze","gear","glee","glow","glue",
  "goat","gore","gown","grab","gram","grim","grin","grip","grit","gust","hack",
  "hail","halt","hang","hare","harm","harp","haul","hawk","haze","heap","heat",
  "heel","herb","herd","hike","hill","hint","hire","hive","hole","holy","hone",
  "hood","hook","horn","hose","host","howl","hulk","hull","hump","hunt","inch",
  "iron","isle","item","jail","jest","jolt","jump","jury","keen","kick","kill",
  "knot","lace","lack","lake","lamb","lamp","lane","lark","lash","lawn","leak",
  "lean","leap","lend","lens","levy","lick","lift","limb","lime","link","lion",
  "loft","lone","loop","lore","lust","mace","male","mall","mare","mash","mast",
  "maze","meal","mean","meat","melt","mesh","mild","milk","mill","mist","mock",
  "mode","mold","mole","monk","moon","moor","moss","moth","mule","myth","nape",
  "navy","near","neck","newt","node","nook","noon","nose","numb","oath","ogre",
  "omit","onto","oral","oven","pace","pack","pact","pair","pale","palm","pane",
  "park","peak","peel","peer","pelt","pest","pier","pile","pill","pine","pink",
  "pint","plow","ploy","plum","plus","poem","poet","poke","pole","poll","pond",
  "pony","pool","pope","pore","port","pose","pout","prey","prod","prop","puff",
  "pump","pure","rack","raft","rage","rake","ramp","rank","rash","reef","reel",
  "rein","rely","rend","rent","reap","robe","rope","rose","rote","rout","ruse",
  "rust","sage","sake","sale","salt","sane","sank","seam","shin","shot","shun",
  "silk","sill","slab","slam","slap","sled","slim","slip","slit","slug","slum",
  "smog","snag","snap","snip","snob","snug","span","spar","spat","spin","spit",
  "stab","stem","stub","stun","suck","suit","sulk","sump","sung","sunk","swap",
  "swat","sway","tack","tame","tang","taut","teak","teal","tend","tent","term",
  "tern","tick","tilt","toad","toil","tomb","tong","tore","torn","tort","toss",
  "tram","trap","tray","trek","trim","trio","trod","trot","tuft","tuna","turf",
  "tusk","twin","ugly","undo","unit","unto","urge","vane","vale","vary","vast",
  "veil","vein","vent","verb","vest","veto","vice","vine","visa","void","volt",
  "wail","ward","weld","welt","wham","whip","whom","wick","woke","womb","wren",
  "yell","yoga","zeal","zest","zinc",
  // 5+ letter words
  "braille","hello","world","place","learn","about","above","after","again",
  "allow","alone","along","apple","apply","arise","avoid","awake","aware",
  "badly","basic","beach","began","begin","being","below","black","blade",
  "blame","blank","blast","blend","blind","block","blood","bloom","board",
  "bound","brain","brand","brave","bread","break","breed","brick","bride",
  "brief","bring","broad","broke","brown","brush","build","built","bunch",
  "carry","catch","cause","chair","charm","chart","chase","cheap","check",
  "chest","chief","child","claim","class","clean","clear","click","cliff",
  "climb","clock","close","cloth","cloud","coach","coast","color","count",
  "court","cover","crack","craft","crash","crazy","cream","crime","cross",
  "crowd","crown","cruel","crush","curve","cycle","daily","dance","death",
  "dream","drink","drive","drunk","early","earth","eight","empty","enjoy",
  "enter","equal","error","event","exact","extra","faith","false","fancy",
  "fault","feast","field","fifth","fifty","fight","final","first","fixed",
  "flame","flash","flesh","float","flood","floor","focus","force","forth",
  "forty","found","frame","fresh","front","frost","fruit","funny","ghost",
  "giant","given","glass","globe","grace","grade","grain","grand","grant",
  "happy","harsh","heart","heavy","might","model","money","month","moral",
  "mount","mouth","music","night","north","novel","nurse","often","other",
  "paint","panel","paper","party","pause","peace","phase","phone","photo",
  "pilot","pitch","plant","plate","point","pound","power","press","price",
  "pride","prime","print","prize","prove","proud","queen","quest","quick",
  "quiet","radio","raise","range","rapid","reach","ready","realm","rebel",
  "right","river","robin","robot","rough","round","route","royal","saint",
  "scale","scene","score","sense","serve","seven","shade","shake","shall",
  "shame","shape","share","sharp","shift","shock","shore","short","sight",
  "silly","since","sixth","sixty","skill","sleep","slice","slide","slope",
  "small","smart","smell","smile","smoke","snake","solar","solid","solve",
  "south","space","speak","speed","spend","sport","stage","steel","steep",
  "stone","store","storm","story","stuck","study","style","sugar","super",
  "sweet","swift","sword","table","teach","teeth","thank","thick","third",
  "those","three","throw","total","touch","tough","trace","track","trade",
  "train","treat","trial","tribe","trick","tried","truly","trust","truth",
  "twice","under","union","until","upper","usual","value","video","viral",
  "virus","visit","vital","voice","waste","watch","water","weigh","where",
  "which","while","white","whole","woman","women","worse","worst","worth",
  "would","write","wrong","young","letter","finger","number","people","string",
  "school","simple","system","mother","father","little","around","always","before",
  "friend","ground","inside","moment","happen","moving","please","spoken","street",
  "answer","button","camera","center","change","choose","circle","create","direct",
  "energy","follow","forest","garden","gather","global","health","honest","images",
  "impact","island","launch","listen","matter","mirror","modern","nature","notice",
  "object","office","online","option","period","phrase","planet","player","policy",
  "pretty","public","reason","record","remain","remove","repair","return","second",
  "secret","signal","silver","single","social","source","speech","square","starts",
  "status","strong","target","thread","ticket","travel","unique","update","upload",
  "useful","valley","vector","window","winter","within","wonder","yellow",
]);

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

/**
 * Improved spell corrector:
 * - Short words (3-4 chars): ed ≤ 1
 * - Longer words (5+ chars): ed ≤ 2
 * - Capitalisation preserved from model output
 */
function spellCorrect(text: string): string {
  return text.split(/\s+/).map(token => {
    if (token.length < 3) return token;
    const lower = token.toLowerCase();
    if (ENGLISH_WORDS.has(lower)) return token; // exact match — preserve case
    const edThreshold = lower.length >= 5 ? 2 : 1;
    let best = lower;
    let bestDist = Infinity;
    for (const word of ENGLISH_WORDS) {
      if (Math.abs(word.length - lower.length) > edThreshold) continue;
      const d = editDistance(lower, word);
      if (d < bestDist) { bestDist = d; best = word; }
    }
    // Preserve capitalisation if first character was upper
    const corrected = bestDist <= edThreshold ? best : lower;
    return token[0] === token[0].toUpperCase() && token[0] !== token[0].toLowerCase()
      ? corrected.charAt(0).toUpperCase() + corrected.slice(1)
      : corrected;
  }).join(" ").trim();
}

/**
 * Medoid: string with minimum total edit distance to all others.
 * Prefers longer strings (fewer missed dots is better than extra dots).
 */
function medoidString(strings: string[]): string {
  if (strings.length === 0) return "";
  if (strings.length === 1) return strings[0];
  const maxLen = Math.max(...strings.map(s => s.replace(/\s/g, "").length));
  const candidates = strings.filter(s => s.replace(/\s/g, "").length >= maxLen * 0.75);
  let best = candidates[0];
  let bestScore = Infinity;
  for (const c of candidates) {
    const total = candidates.reduce((sum, o) => sum + editDistance(c, o), 0);
    if (total < bestScore) { bestScore = total; best = c; }
  }
  return best;
}

/**
 * Sort detections into lines and insert spaces from physical X gaps.
 * Enhanced: uses median cell size (more robust to outliers than mean).
 */
function sortAndDetectSpaces(detections: Detection[]): string {
  if (detections.length === 0) return "";

  const byY = [...detections].sort((a, b) => a.y - b.y);

  // Use median for robustness
  const heights = byY.map(d => d.height).sort((a, b) => a - b);
  const widths = byY.map(d => d.width).sort((a, b) => a - b);
  const medH = heights[Math.floor(heights.length / 2)];
  const medW = widths[Math.floor(widths.length / 2)];
  const yThreshold = medH * 0.6;  // tighter than 0.5× to handle tilted text better

  // Cluster into lines
  const lines: Detection[][] = [];
  let cur: Detection[] = [byY[0]];
  for (let i = 1; i < byY.length; i++) {
    if (byY[i].y - byY[i - 1].y > yThreshold) { lines.push(cur); cur = [byY[i]]; }
    else cur.push(byY[i]);
  }
  lines.push(cur);

  const lineTexts: string[] = [];
  for (const line of lines) {
    line.sort((a, b) => a.x - b.x);
    let lineStr = "";
    for (let i = 0; i < line.length; i++) {
      if (i > 0) {
        const prevEnd = line[i - 1].x + line[i - 1].width;
        const thisStart = line[i].x;
        const gap = thisStart - prevEnd;
        // Gap > 1.2× median cell width → word space
        if (gap > medW * 1.2) lineStr += " ";
      }
      lineStr += classIdToChar(line[i].classId);
    }
    lineTexts.push(lineStr.trim());
  }
  return lineTexts.filter(l => l.length > 0).join("\n");
}

// ─── Component ──────────────────────────────────────────────────────────────
const TranslatePage = () => {
  const { toast } = useToast();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedText, setDetectedText] = useState<string>("");

  // Text → Braille panel
  const [tbrailleInput, setTbrailleInput] = useState("");
  const brailleOutput = englishToBraille(tbrailleInput);

  // Three stages of translation
  const [rawText, setRawText] = useState<string>("");
  const [stableText, setStableText] = useState<string>("");
  const [corrected, setCorrected] = useState<string>("");

  const [isSpeaking, setIsSpeaking] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMirrored, setIsMirrored] = useState(false);
  const [isAiMirrored, setIsAiMirrored] = useState(false);
  const [session, setSession] = useState<ModelSession | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [dotCount, setDotCount] = useState(0);
  const frameBuffer = useRef<string[]>([]);

  // Confidence threshold control
  const [confThreshold, setConfThreshold] = useState(35); // percent

  useEffect(() => {
    loadModel(MODEL_PATH)
      .then(s => { setSession(s); toast({ title: "AI Ready" }); })
      .catch(() => toast({ title: "Error loading AI model", variant: "destructive" }))
      .finally(() => setIsModelLoading(false));
  }, [toast]);

  // Update threshold when slider changes
  useEffect(() => {
    session?.setConfidenceThreshold(confThreshold / 100);
  }, [confThreshold, session]);

  useEffect(() => {
    if (!isCameraActive || !session) return;
    let stopped = false;

    const loop = async () => {
      if (stopped) return;
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;
      if (video && video.readyState === 4 && canvas) {
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);

          const input = await preprocess(video, INPUT_DIM, INPUT_DIM, isAiMirrored);
          const dets = await session.run(input, INPUT_DIM, INPUT_DIM);

          if (dets.length > 0) {
            setDotCount(dets.length);

            // Stage 1: raw text with space detection
            const frame = sortAndDetectSpaces(dets);
            setRawText(frame);

            // Accumulate non-empty frames
            if (frame.trim()) {
              frameBuffer.current.push(frame);
              if (frameBuffer.current.length > BUFFER_SIZE) frameBuffer.current.shift();
            }

            // Stage 2: medoid stabilisation (need at least 3 frames)
            if (frameBuffer.current.length >= 3) {
              const stable = medoidString(frameBuffer.current);
              setStableText(stable);

              // Stage 3: spell correction
              const correctedText = spellCorrect(stable);
              setCorrected(correctedText);
            }

            // Draw bounding boxes
            if (ctx) {
              dets.forEach(det => {
                const x = (det.x / INPUT_DIM) * canvas.width;
                const y = (det.y / INPUT_DIM) * canvas.height;
                const w = (det.width / INPUT_DIM) * canvas.width;
                const h = (det.height / INPUT_DIM) * canvas.height;
                // Colour by confidence: green = high, yellow = medium
                const conf = det.confidence;
                ctx.strokeStyle = conf > 0.6 ? "#10b981" : conf > 0.4 ? "#f59e0b" : "#ef4444";
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, w, h);
                const ch = classIdToChar(det.classId);
                if (ch?.trim()) {
                  ctx.fillStyle = ctx.strokeStyle;
                  ctx.font = "bold 13px monospace";
                  ctx.fillText(ch, x + 2, y - 3);
                }
              });
            }
          } else {
            setDotCount(0);
            setRawText("");
          }
        } catch (e) { console.error(e); }
      }
      if (!stopped) setTimeout(loop, 400); // 400ms → ~2.5 fps, smoother than 500ms
    };

    loop();
    return () => { stopped = true; };
  }, [isCameraActive, session, isAiMirrored]);

  const resetState = () => {
    frameBuffer.current = [];
    setRawText(""); setStableText(""); setCorrected("");
    setDotCount(0);
  };

  const commitToLog = () => {
    const toAdd = (corrected || stableText || rawText).trim();
    if (!toAdd) return;
    setDetectedText(prev => prev.trim() ? `${prev.trim()} ${toAdd}` : toAdd);
    resetState();
    toast({ title: "Saved!", description: `"${toAdd}"` });
  };

  const toggleCamera = () => { setIsCameraActive(p => !p); setDetectedText(""); resetState(); };

  const handleSpeak = useCallback(() => {
    if (!detectedText) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(detectedText);
    setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [detectedText]);

  const displayText = corrected || stableText || rawText;

  return (
    <div className="min-h-screen pt-24 px-4 pb-12 bg-slate-50">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">Braille Translator</h1>
          <p className="text-muted-foreground text-lg">DotNeuralNet · Edit-distance stabilisation · Spell correction</p>
        </header>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-12 flex flex-wrap gap-3 items-center">
            <Button onClick={toggleCamera} variant={isCameraActive ? "destructive" : "default"} className="h-12 px-6 rounded-xl font-bold">
              {isCameraActive ? <CameraOff className="w-5 h-5 mr-2" /> : <Camera className="w-5 h-5 mr-2" />}
              {isCameraActive ? "Stop Camera" : "Start Scanning"}
            </Button>
            {isCameraActive && (
              <>
                <Button variant="outline" className="h-12 rounded-xl" onClick={() => setIsMirrored(!isMirrored)}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Flip Preview
                </Button>
                <Button
                  variant={isAiMirrored ? "secondary" : "outline"}
                  className={`h-12 rounded-xl font-semibold ${isAiMirrored ? "border-primary text-primary" : ""}`}
                  onClick={() => { setIsAiMirrored(!isAiMirrored); resetState(); toast({ title: `AI Mirror: ${!isAiMirrored ? "ON" : "OFF"}` }); }}
                >
                  <FlipHorizontal className="w-4 h-4 mr-2" /> AI Mirror: {isAiMirrored ? "ON" : "OFF"}
                </Button>
                {/* Confidence threshold slider */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl h-12 px-4">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confidence</span>
                  <input
                    type="range" min={15} max={75} step={5} value={confThreshold}
                    onChange={e => setConfThreshold(Number(e.target.value))}
                    className="w-24 accent-emerald-600"
                  />
                  <span className="text-xs font-black text-emerald-700 w-8">{confThreshold}%</span>
                </div>
              </>
            )}
          </div>

          {/* Left: Camera */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
              {isCameraActive ? (
                <>
                  <Webcam ref={webcamRef} audio={false} mirrored={isMirrored} videoConstraints={{ facingMode: "environment" }} className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
                  <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${dotCount > 0 ? "bg-green-400 animate-pulse" : "bg-slate-500"}`} />
                    <span className="text-xs font-bold text-white/80">{dotCount > 0 ? `${dotCount} cells` : "Scanning..."}</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  {isModelLoading ? <RefreshCw className="w-12 h-12 text-primary animate-spin" /> : <Camera className="w-16 h-16 text-white/10" />}
                  <p className="mt-4 text-white/30 text-sm">{isModelLoading ? "Loading model..." : "Camera offline"}</p>
                </div>
              )}
            </div>

            {/* 3-tier result */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-24 shrink-0">Per-Frame</div>
                <div className="font-mono text-base text-slate-400 truncate">{rawText || "—"}</div>
              </div>
              <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50">
                <div className="text-[9px] font-black text-primary uppercase tracking-widest w-24 shrink-0">Stabilised</div>
                <div className="font-mono text-base text-slate-700 truncate">{stableText || "—"}</div>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest w-24 shrink-0">✓ Corrected</div>
                  <div className="font-mono text-2xl font-black text-slate-900 tracking-tight truncate">
                    {corrected || <span className="text-slate-300 text-base font-normal">Processing...</span>}
                  </div>
                </div>
                <Button
                  disabled={!displayText}
                  onClick={commitToLog}
                  className="shrink-0 h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black flex items-center gap-2 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> SAVE
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex gap-3 text-sm text-blue-800">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <b>3-stage pipeline:</b> Raw detection → Edit-distance stabilisation ({BUFFER_SIZE} frames) → Spell correction.
                Use the <b>Confidence</b> slider to tune sensitivity. Higher = fewer false positives. Lower = catches faint dots.
                Hit <b>SAVE</b> when the ✓ Corrected row looks right.
              </div>
            </div>
          </div>

          {/* Right: log */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 h-full flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> Translation Log
                </h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { navigator.clipboard.writeText(detectedText); toast({ title: "Copied!" }); }}>
                    <Copy className="w-4 h-4 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-red-400 hover:bg-red-50" onClick={() => setDetectedText("")}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 min-h-[380px] bg-slate-50 rounded-2xl p-5 font-mono text-2xl leading-loose text-slate-800 border border-slate-100 overflow-y-auto">
                {detectedText ? (
                  <div className="animate-in fade-in duration-300 whitespace-pre-wrap">{detectedText}</div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center">
                    <RefreshCw className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm font-medium">Saved translations appear here</p>
                  </div>
                )}
              </div>

              <Button onClick={handleSpeak} disabled={!detectedText || isSpeaking} className="w-full mt-5 py-7 text-lg font-bold rounded-2xl">
                <Volume2 className={`w-6 h-6 mr-3 ${isSpeaking ? "animate-pulse" : ""}`} />
                {isSpeaking ? "Reading aloud..." : "Read Aloud"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Text → Braille Converter ── */}
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
              <Type className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-800">Text → Braille</h2>
              <p className="text-sm text-muted-foreground">Type any English text and see it rendered in Grade 1 Braille (with capital & number indicators)</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                English Text
              </label>
              <textarea
                id="braille-input"
                className="w-full h-40 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 transition placeholder:text-slate-300"
                placeholder="Type here… e.g. Hello World 123"
                value={tbrailleInput}
                onChange={e => setTbrailleInput(e.target.value)}
              />
              <p className="mt-2 text-xs text-slate-400">
                Supports A–Z (auto-capitalised), a–z, 0–9, and common punctuation · Grade 1 Braille with indicators
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-black uppercase tracking-widest text-violet-600">
                  ⠃⠗⠁⠊⠇⠇⠑ &nbsp;Output
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost" size="icon" className="rounded-full"
                    disabled={!brailleOutput.trim()}
                    onClick={() => { navigator.clipboard.writeText(brailleOutput); toast({ title: "Braille copied!" }); }}
                  >
                    <Copy className="w-4 h-4 text-slate-400" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="rounded-full"
                    disabled={!tbrailleInput.trim()}
                    onClick={() => { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(tbrailleInput); window.speechSynthesis.speak(u); }}
                  >
                    <Volume2 className="w-4 h-4 text-slate-400" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="rounded-full text-red-400 hover:bg-red-50"
                    onClick={() => setTbrailleInput("")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 min-h-[9rem] rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 flex items-center justify-center px-5 py-4 overflow-auto">
                {brailleOutput.trim() ? (
                  <div
                    className="font-mono text-5xl leading-relaxed tracking-widest text-violet-700 break-all select-all text-center"
                    style={{ fontFamily: "'Noto Sans Symbols 2', 'Segoe UI Symbol', monospace" }}
                  >
                    {brailleOutput}
                  </div>
                ) : (
                  <p className="text-slate-300 text-sm font-medium">Braille will appear here…</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                {tbrailleInput
                  .split("")
                  .filter((ch, i, arr) => arr.indexOf(ch) === i && /[a-zA-Z0-9 .,!?]/.test(ch))
                  .slice(0, 12)
                  .map(ch => (
                    <span key={ch} className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <span className="font-mono text-violet-600 text-base" style={{ fontFamily: "'Noto Sans Symbols 2', 'Segoe UI Symbol', monospace" }}>
                        {englishToBraille(ch)}
                      </span>
                      <span>=</span>
                      <span className="font-bold">{ch === " " ? "⎵" : ch}</span>
                    </span>
                  ))
                }
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TranslatePage;
