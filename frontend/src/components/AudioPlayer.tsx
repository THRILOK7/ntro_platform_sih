/**
 * Audio Player Component
 * Lightweight native audio player with custom controls.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  isLoading?: boolean;
  onError?: (error: string) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  title = 'Audio Narration',
  isLoading = false,
  onError,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioError, setIsAudioError] = useState(false);

  // Setup audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setIsAudioError(true);
      onError?.('Failed to load audio');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onError]);

  // Update play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error('Play error:', err);
        setIsPlaying(false);
        onError?.('Failed to play audio');
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, onError]);

  // Update volume
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || isNaN(duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isAudioError) {
    return (
      <div className="bg-slate-900 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
        Error loading audio. Please try again.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
      <audio ref={audioRef} src={audioUrl} crossOrigin="anonymous" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">{title}</span>
        {isLoading && (
          <div className="text-xs text-slate-400">Loading...</div>
        )}
      </div>

      {/* Play Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlayPause}
          disabled={isLoading || isAudioError}
          className="flex-shrink-0 p-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        {/* Progress Bar */}
        <div
          className="flex-1 group cursor-pointer"
          onClick={handleProgressClick}
        >
          <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden group-hover:h-3 transition-all">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{
                width: `${isNaN(duration) ? 0 : (currentTime / duration) * 100}%`,
              }}
            ></div>
            {!isNaN(duration) && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-400 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  left: `${(currentTime / duration) * 100}%`,
                }}
              ></div>
            )}
          </div>
        </div>

        {/* Time Display */}
        <span className="text-xs text-slate-400 font-mono min-w-fit">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMute}
          className="flex-shrink-0 p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            const newVolume = parseFloat(e.target.value);
            setVolume(newVolume);
            if (newVolume > 0 && isMuted) {
              setIsMuted(false);
            }
          }}
          className="flex-1 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
              (isMuted ? 0 : volume) * 100
            }%, #475569 ${(isMuted ? 0 : volume) * 100}%, #475569 100%)`,
          }}
        />
      </div>

      {/* Download Button */}
      <div className="flex gap-2 pt-2 border-t border-slate-700">
        <a
          href={audioUrl}
          download={`audio_narration.mp3`}
          className="flex-1 px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors text-center"
        >
          Download MP3
        </a>
      </div>
    </div>
  );
};
