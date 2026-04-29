import { useEffect, useRef, useState, useCallback } from "react";
import PptxViewJS from "pptxviewjs";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PptxViewerProps = {
  /** Full URL to the .pptx file (same origin or CORS-enabled). */
  src: string;
  className?: string;
  width?: number;
  height?: number;
};

type ViewerInstance = {
  destroy: () => void;
  nextSlide: (canvas?: HTMLCanvasElement | null) => Promise<unknown>;
  previousSlide: (canvas?: HTMLCanvasElement | null) => Promise<unknown>;
  goToSlide: (index: number, canvas?: HTMLCanvasElement | null) => Promise<unknown>;
  render: (canvas?: HTMLCanvasElement | null, options?: { quality?: string }) => Promise<unknown>;
  getSlideCount: () => number;
  getCurrentSlideIndex: () => number;
};

const DEFAULT_WIDTH = 960;
const DEFAULT_HEIGHT = 540;

/**
 * Renders a PPTX file with prev/next controls. Uses fixed dimensions so the full slide fits correctly (16:9).
 */
export default function PptxViewer({ src, className = "", width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT }: PptxViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<ViewerInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);

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
        }) as ViewerInstance;
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
  }, [src]);

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

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg text-muted-foreground text-sm p-6 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Fixed aspect-ratio (16:9) box so the full slide fits and is not cropped */}
      <div
        className="relative w-full bg-muted/30 rounded-t-lg overflow-hidden"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/90 rounded-t-lg text-muted-foreground text-sm z-10">
            Loading PPTX…
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block w-full h-full rounded-t-lg border border-border border-b-0"
          style={{ objectFit: "contain" }}
        />
      </div>

      {!loading && totalSlides > 0 && (
        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-muted/80 rounded-b-lg border border-border border-t-0">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!canGoPrev}
            onClick={() => goTo("first")}
            title="First slide"
            aria-label="First slide"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!canGoPrev}
            onClick={() => goTo("prev")}
            title="Previous slide"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[7rem] text-center text-sm font-medium text-foreground tabular-nums">
            {currentSlide + 1} / {totalSlides}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!canGoNext}
            onClick={() => goTo("next")}
            title="Next slide"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!canGoNext}
            onClick={() => goTo("last")}
            title="Last slide"
            aria-label="Last slide"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
