import React, { useRef, useState, useEffect } from "react";
import { PenTool, Keyboard, Check, RotateCcw, Trash2, Sparkles, ChevronDown, List } from "lucide-react";
import { Language } from "../translations";

interface HandwritingSizeInputProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  language: Language;
  triggerToast?: (msg: string, type?: "success" | "error" | "info") => void;
  placeholder?: string;
}

export default function HandwritingSizeInput({
  id = "handwriting-size-input",
  value,
  onChange,
  language,
  triggerToast,
  placeholder
}: HandwritingSizeInputProps) {
  const [mode, setMode] = useState<"text" | "canvas" | "preset">("text");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (mode === "canvas" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set up white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#1e293b";
        
        // Save initial blank state for undo
        const blank = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([blank]);
        setHasDrawn(false);
      }
    }
  }, [mode]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ("touches" in e) {
      // Prevent scrolling when drawing on mobile
      e.stopPropagation();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ("touches" in e) {
      e.stopPropagation();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Save to history
    const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-15), state]);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const blank = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([blank]);
    setHasDrawn(false);
  };

  const handleUndo = () => {
    if (history.length <= 1) {
      handleClear();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nextHistory = history.slice(0, -1);
    const previousState = nextHistory[nextHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(nextHistory);
    setHasDrawn(nextHistory.length > 1);
  };

  const handleConvertToText = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      triggerToast?.(
        language === "TR" 
          ? "Lütfen önce ekrana el yazınızla bir beden veya metin yazın." 
          : "Please write something on the pad first.", 
        "info"
      );
      return;
    }

    setIsRecognizing(true);
    triggerToast?.(
      language === "TR" 
        ? "El yazısı taranıyor ve metne dönüştürülüyor..." 
        : "Recognizing handwritten text...", 
      "info"
    );

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const res = await fetch("/api/ai/recognize-handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl })
      });

      if (!res.ok) {
        throw new Error("Recognition request failed");
      }

      const data = await res.json();
      if (data.text) {
        onChange(data.text);
        triggerToast?.(
          language === "TR" 
            ? `Metne Çevrildi: "${data.text}"` 
            : `Converted to: "${data.text}"`, 
          "success"
        );
        setMode("text");
      } else {
        triggerToast?.(
          language === "TR" 
            ? "Metin algılanamadı, lütfen daha net yazmayı deneyin veya klavye ile yazın." 
            : "Could not clearly recognize text. Please write clearly or type manually.", 
          "error"
        );
      }
    } catch (err: any) {
      console.error(err);
      triggerToast?.(
        language === "TR" 
          ? "Dönüştürme sırasında hata oluştu. Metin kutusuna doğrudan yazabilirsiniz." 
          : "Handwriting OCR error. You can type directly into the text box.", 
        "error"
      );
    } finally {
      setIsRecognizing(false);
    }
  };

  const months = ["0-3 Ay", "3-6 Ay", "6-9 Ay", "9-12 Ay", "12-18 Ay", "18-24 Ay"];
  const years = Array.from({ length: 17 }, (_, i) => `${i} Yaş`);
  const adultSizes = ["XS", "S", "M", "L", "XL", "XXL", "36", "38", "40", "42", "44"];

  return (
    <div id={id} className="space-y-1.5 w-full">
      {/* Mode Switches */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            id={`${id}-mode-text-btn`}
            onClick={() => setMode("text")}
            className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
              mode === "text" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
            title="Klavyeyle Yaz"
          >
            <Keyboard className="h-3 w-3" />
            <span>{language === "TR" ? "Yazı" : "Type"}</span>
          </button>

          <button
            type="button"
            id={`${id}-mode-canvas-btn`}
            onClick={() => setMode("canvas")}
            className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
              mode === "canvas" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
            title="El Yazısı ile Çiz & Metne Dönüştür"
          >
            <PenTool className="h-3 w-3" />
            <span>{language === "TR" ? "El Yazısı (Çiz)" : "Draw & OCR"}</span>
          </button>

          <button
            type="button"
            id={`${id}-mode-preset-btn`}
            onClick={() => setMode("preset")}
            className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
              mode === "preset" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
            title="Ön Tanımlı Beden Listesi"
          >
            <List className="h-3 w-3" />
            <span>{language === "TR" ? "Liste" : "List"}</span>
          </button>
        </div>

        {value && (
          <span className="text-[9px] font-mono font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md truncate max-w-[90px]">
            {value}
          </span>
        )}
      </div>

      {/* MODE 1: Direct Text Input (Write freely by hand/keyboard) */}
      {mode === "text" && (
        <div className="relative">
          <input
            id={`${id}-input-text`}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || (language === "TR" ? "Örn: 6-9 Ay, 4 Yaş, XL veya 36..." : "e.g. 6-9 Months, 4 Years, XL...")}
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* MODE 2: Handwriting Canvas Pad */}
      {mode === "canvas" && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <PenTool className="h-3 w-3 text-indigo-600" />
              <span>{language === "TR" ? "El Yazısı Çizim Alanı" : "Handwriting Pad"}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Geri Al"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                title="Temizle"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner">
            <canvas
              ref={canvasRef}
              width={280}
              height={90}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[85px] touch-none cursor-crosshair block bg-white"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[10px] text-slate-300 font-bold select-none">
                {language === "TR" ? "Parmağınız veya fare ile buraya yazın..." : "Write by finger or stylus here..."}
              </div>
            )}
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              id={`${id}-convert-btn`}
              onClick={handleConvertToText}
              disabled={!hasDrawn || isRecognizing}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-[10px] font-black py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              <span>{isRecognizing ? (language === "TR" ? "Taranıyor..." : "Converting...") : (language === "TR" ? "Metne Dönüştür" : "Convert to Text")}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("text")}
              className="px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              {language === "TR" ? "Tamam" : "Done"}
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: Preset Dropdown List */}
      {mode === "preset" && (
        <select
          id={`${id}-select-preset`}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setMode("text");
          }}
          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
        >
          <option value="">{language === "TR" ? "-- Beden Seçin --" : "-- Select Size --"}</option>
          <optgroup label={language === "TR" ? "Bebek (Ay)" : "Baby (Months)"}>
            {months.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </optgroup>
          <optgroup label={language === "TR" ? "Çocuk (Yaş)" : "Kids (Years)"}>
            {years.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </optgroup>
          <optgroup label={language === "TR" ? "Standart / Yetişkin" : "Standard / Adult"}>
            {adultSizes.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </optgroup>
        </select>
      )}
    </div>
  );
}
