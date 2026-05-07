import { useState, useEffect, useCallback, useRef } from "react";

export interface WebcamDevice {
  deviceId: string;
  label: string;
}

export interface UseWebcamsReturn {
  /** Available video input devices */
  devices: WebcamDevice[];
  /** Active streams keyed by deviceId */
  streams: Map<string, MediaStream>;
  /** Activate a specific camera */
  activateCamera: (deviceId: string) => Promise<void>;
  /** Deactivate a specific camera */
  deactivateCamera: (deviceId: string) => void;
  /** Activate all available cameras (up to maxCameras) */
  activateAll: () => Promise<void>;
  /** Deactivate all cameras */
  deactivateAll: () => void;
  /** Re-enumerate devices */
  refreshDevices: () => Promise<void>;
  /** Error message if any */
  error: string | null;
}

/**
 * React hook for managing multiple simultaneous webcam streams.
 *
 * @param maxCameras - Maximum number of cameras to activate (default 5)
 */
export function useWebcams(maxCameras: number = 5): UseWebcamsReturn {
  const [devices, setDevices] = useState<WebcamDevice[]>([]);
  const [streams, setStreams] = useState<Map<string, MediaStream>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());

  // Enumerate video input devices
  const refreshDevices = useCallback(async () => {
    try {
      setError(null);
      // Request permission first (needed to get device labels)
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach((t) => t.stop());
      } catch {
        // Permission may already be granted
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));

      setDevices(videoDevices);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to enumerate devices";
      setError(msg);
    }
  }, []);

  // Activate a single camera
  const activateCamera = useCallback(
    async (deviceId: string) => {
      if (streamsRef.current.has(deviceId)) return;
      if (streamsRef.current.size >= maxCameras) {
        setError(`Maximum ${maxCameras} cameras already active`);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 15, max: 15 },
          },
        });

        streamsRef.current.set(deviceId, stream);
        setStreams(new Map(streamsRef.current));
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to activate camera";
        setError(msg);
      }
    },
    [maxCameras]
  );

  // Deactivate a single camera
  const deactivateCamera = useCallback((deviceId: string) => {
    const stream = streamsRef.current.get(deviceId);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamsRef.current.delete(deviceId);
      setStreams(new Map(streamsRef.current));
    }
  }, []);

  // Activate all available cameras
  const activateAll = useCallback(async () => {
    const toActivate = devices.slice(0, maxCameras);
    for (const device of toActivate) {
      if (!streamsRef.current.has(device.deviceId)) {
        await activateCamera(device.deviceId);
      }
    }
  }, [devices, maxCameras, activateCamera]);

  // Deactivate all cameras
  const deactivateAll = useCallback(() => {
    for (const [, stream] of streamsRef.current) {
      stream.getTracks().forEach((t) => t.stop());
    }
    streamsRef.current.clear();
    setStreams(new Map());
  }, []);

  // Enumerate devices on mount
  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // Cleanup all streams on unmount
  useEffect(() => {
    return () => {
      for (const [, stream] of streamsRef.current) {
        stream.getTracks().forEach((t) => t.stop());
      }
      streamsRef.current.clear();
    };
  }, []);

  return {
    devices,
    streams,
    activateCamera,
    deactivateCamera,
    activateAll,
    deactivateAll,
    refreshDevices,
    error,
  };
}
