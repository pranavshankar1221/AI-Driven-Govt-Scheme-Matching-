import { useState, useRef, useCallback } from 'react';

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
  clearError: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors during cleanup
        }
      });
      streamRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = 'Audio recording is not supported on this browser/device.';
      setError(msg);
      throw new Error(msg);
    }

    if (typeof MediaRecorder === 'undefined') {
      const msg = 'MediaRecorder is not supported in this browser.';
      setError(msg);
      throw new Error(msg);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported MIME type
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const audioBlob = audioChunksRef.current.length > 0
          ? new Blob(audioChunksRef.current, { type })
          : null;

        cleanupStream();
        setIsRecording(false);
        mediaRecorderRef.current = null;

        if (stopResolverRef.current) {
          stopResolverRef.current(audioBlob);
          stopResolverRef.current = null;
        }
      };

      recorder.onerror = (event) => {
        const msg = 'MediaRecorder encountered an error during recording.';
        setError(msg);
        cleanupStream();
        setIsRecording(false);
        if (stopResolverRef.current) {
          stopResolverRef.current(null);
          stopResolverRef.current = null;
        }
      };

      recorder.start(100); // collect in 100ms slices
      setIsRecording(true);
    } catch (err: unknown) {
      cleanupStream();
      setIsRecording(false);
      let errMsg = 'Could not access microphone.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errMsg = 'No microphone device was found on this system.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errMsg = 'Microphone is already in use by another application.';
        }
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      setError(errMsg);
      throw new Error(errMsg);
    }
  }, [cleanupStream]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        cleanupStream();
        setIsRecording(false);
        resolve(null);
        return;
      }

      stopResolverRef.current = resolve;
      try {
        recorder.stop();
      } catch (err) {
        cleanupStream();
        setIsRecording(false);
        resolve(null);
      }
    });
  }, [cleanupStream]);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        // Ignore stop error on cancellation
      }
    }
    cleanupStream();
    setIsRecording(false);
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    if (stopResolverRef.current) {
      stopResolverRef.current(null);
      stopResolverRef.current = null;
    }
  }, [cleanupStream]);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
  };
}

export default useVoiceRecorder;
