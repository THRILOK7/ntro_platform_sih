/**
 * Audio Player Component
 * Flat Design audio playback controls.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react';

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

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
        onError?.('Failed to play audio');
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, onError]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlayPause = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

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
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700 text-xs font-semibold">
        Error loading audio file.
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-5 space-y-4">
      <audio ref={audioRef} src={audioUrl} crossOrigin="anonymous" />

      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[#111827] uppercase tracking-wider">{title}</span>
        {isLoading && <span className="text-[#3B82F6] font-semibold animate-pulse">Loading audio...</span>}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlayPause}
          disabled={isLoading}
          className="w-10 h-10 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center justify-center transition-colors flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <div className="flex-1 cursor-pointer py-2" onClick={handleProgressClick}>
          <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3B82F6] transition-all"
              style={{
                width: `${isNaN(duration) ? 0 : (currentTime / duration) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        <span className="text-xs text-[#6B7280] font-mono min-w-fit font-semibold">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleMute} className="text-[#6B7280] hover:text-[#111827] p-1">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-24 h-1.5 bg-[#E5E7EB] rounded-lg cursor-pointer accent-[#3B82F6]"
          />
        </div>

        <a
          href={audioUrl}
          download="audio_narration.mp3"
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#111827] bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] rounded-md transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download MP3</span>
        </a>
      </div>
    </div>
  );
};

export default AudioPlayer;
