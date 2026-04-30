import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import PptxViewJS from "pptxviewjs";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PptxViewerRef = {
  nextSlide: () => void;
  previousSlide: () => void;
  goToSlide: (index: number) => void;
  getCurrentSlide: () => number;
  getTotalSlides: () => number;
};

type PptxViewerProps = {
  /** Full URL to the .pptx file (same origin or CORS-enabled). */
  src: string;
  className?: string;
  width?: number;
  height?: number;
  onSlideChange?: (current: number, total: number) => void;
};

type ViewerInstance = {
  destroy: () => void;
  loadFromUrl: (url: string) => Promise<any>;
  nextSlide: (canvas?: HTMLCanvasElement | null) => Promise<any>;
  previousSlide: (canvas?: HTMLCanvasElement | null) => Promise<any>;
  goToSlide: (index: number, canvas?: HTMLCanvasElement | null) => Promise<any>;
  render: (canvas?: HTMLCanvasElement | null, options?: { quality?: string }) => Promise<any>;
  getSlideCount: () => number;
  getCurrentSlideIndex: () => number;
};

const DEFAULT_WIDTH = 960;
const DEFAULT_HEIGHT = 540;

/**
 * Renders a PPTX file with prev/next controls. Uses fixed dimensions so the full slide fits correctly (16:9).
 */
const PptxViewer = forwardRef<PptxViewerRef, PptxViewerProps>(({ src, className = "", width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, onSlideChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<ViewerInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);

  useEffect(() => {
    if (onSlideChange) onSlideChange(currentSlide, totalSlides);
  }, [currentSlide, totalSlides, onSlideChange]);

  const goTo = useCallback(
    async (direction: "prev" | "next" | "first" | "last") => {
      const viewer = viewerRef.current;
      const canvas = canvasRef.current;
      if (!viewer || !canvas || totalSlides === 0) return;

      try {
        if (direction === "prev") await viewer.previousSlide(canvas);
        else if (direction === "next") await viewer.nextSlide(canvas);
        else if (direction === "first") await viewer.goToSlide(0, canvas);
        else if (direction === "last") await viewer.goToSlide(totalSlides - 1, canvas);
        await viewer.render(canvas, { quality: "high" });
        setCurrentSlide(viewer.getCurrentSlideIndex());
      } catch {
        // ignore
      }
    },
    [totalSlides]
  );

  useImperativeHandle(ref, () => ({
    nextSlide: () => goTo("next"),
    previousSlide: () => goTo("prev"),
    goToSlide: (index: number) => {
      const viewer = viewerRef.current;
      const canvas = canvasRef.current;
      if (viewer && canvas) {
        viewer.goToSlide(index, canvas).then(() => {
          viewer.render(canvas, { quality: "high" });
          setCurrentSlide(viewer.getCurrentSlideIndex());
        });
      }
    },
    getCurrentSlide: () => currentSlide,
    getTotalSlides: () => totalSlides,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;

    let cancelled = false;
    setError(null);
    setLoading(true);
    setCurrentSlide(0);
    setTotalSlides(0);

    const run = async () => {
      try {
        const viewer = new PptxViewJS.PPTXViewer({
          canvas,
          enableThumbnails: false,
          slideSizeMode: "fit",
        }) as unknown as ViewerInstance;
        viewerRef.current = viewer;
        await viewer.loadFromUrl(src);
        if (cancelled) return;
        await viewer.render(canvas, { quality: "high" });
        if (cancelled) return;
        setTotalSlides(viewer.getSlideCount());
        setCurrentSlide(viewer.getCurrentSlideIndex());
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load presentation");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [src, width, height]);

  const canGoPrev = totalSlides > 0 && currentSlide > 0;
  const canGoNext = totalSlides > 0 && currentSlide < totalSlides - 1;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (loading || totalSlides === 0) return;
      if (e.key === "ArrowLeft" && canGoPrev) {
        e.preventDefault();
        goTo("prev");
      } else if (e.key === "ArrowRight" && canGoNext) {
        e.preventDefault();
        goTo("next");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, totalSlides, canGoPrev, canGoNext, goTo]);

  return (
    <div className={`relative flex flex-col items-center justify-center bg-black ${className}`}>
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-white text-sm font-medium">Loading presentation...</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-destructive p-6 text-center z-10">
            <p className="font-bold mb-2">Failed to load PPTX</p>
            <p className="text-xs">{error}</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block max-w-full max-h-full"
          style={{ objectFit: "contain" }}
        />
      </div>
    </div>
  );
});

export default PptxViewer;
