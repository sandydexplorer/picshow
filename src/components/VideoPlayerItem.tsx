import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, StyleSheet, useWindowDimensions, TouchableOpacity, Text,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

interface Props {
  uri: string;
  isActive: boolean;
  onToggleUI?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

const VideoPlayerItem: React.FC<Props> = ({ uri, isActive, onToggleUI }) => {
  const { width, height } = useWindowDimensions();
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);

  const autoHideTimer = useRef<any>(null);

  const player = useVideoPlayer(uri, p => {
    p.loop = true;
  });

  const resetAutoHide = useCallback(() => {
    if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    setShowControls(true);
    autoHideTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  useEffect(() => {
    if (!player) return;
    try {
      if (isActive) {
        player.play();
        setIsPlaying(true);
        resetAutoHide();
      } else {
        player.pause();
        setIsPlaying(false);
      }
    } catch (e) {
      console.warn('VideoPlayer error:', e);
      setHasError(true);
    }
  }, [isActive, player, resetAutoHide]);

  // Periodic poll to update player progress & time
  useEffect(() => {
    if (!isActive || !player) return;
    const interval = setInterval(() => {
      try {
        if (player.currentTime !== undefined) {
          setCurrentTime(player.currentTime);
        }
        if (player.duration !== undefined && player.duration > 0) {
          setDuration(player.duration);
        }
      } catch {}
    }, 300);
    return () => clearInterval(interval);
  }, [isActive, player]);

  const togglePlayPause = () => {
    if (!player) return;
    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
      resetAutoHide();
    } catch (e) {
      console.warn('togglePlayPause error:', e);
    }
  };

  const handleSeek = (evt: any) => {
    if (!player || duration <= 0) return;
    const clickX = evt.nativeEvent.locationX;
    const barWidth = width - 48; // padding 24 on each side
    const ratio = Math.max(0, Math.min(1, clickX / barWidth));
    const targetTime = ratio * duration;
    try {
      player.currentTime = targetTime;
      setCurrentTime(targetTime);
      resetAutoHide();
    } catch (e) {
      console.warn('seek error:', e);
    }
  };

  const handleSeekBy = (seconds: number) => {
    if (!player) return;
    try {
      player.seekBy(seconds);
      resetAutoHide();
    } catch (e) {
      console.warn('seekBy error:', e);
    }
  };

  if (hasError) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>Unable to play video</Text>
      </View>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={[styles.container, { width, height }]}>
      <VideoView
        style={[styles.video, { width, height }]}
        player={player}
        nativeControls={false}
        contentFit="contain"
        fullscreenOptions={{ enable: true, orientation: 'default' }}
        allowsPictureInPicture={false}
      />

      {/* Screen tap to toggle controls overlay */}
      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={() => {
          if (showControls) {
            setShowControls(false);
          } else {
            resetAutoHide();
          }
          onToggleUI?.();
        }}
      >
        {showControls && (
          <View style={styles.overlayContainer}>
            {/* Center Controls: Seek -10s, Play/Pause, Seek +10s */}
            <View style={styles.centerControls}>
              <TouchableOpacity style={styles.controlCircleBtn} onPress={() => handleSeekBy(-10)}>
                <Ionicons name="play-back-outline" size={26} color={Colors.white} />
                <Text style={styles.seekLabel}>-10s</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.playCircleBtn} onPress={togglePlayPause}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={36}
                  color={Colors.white}
                  style={!isPlaying ? { marginLeft: 3 } : undefined}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlCircleBtn} onPress={() => handleSeekBy(10)}>
                <Ionicons name="play-forward-outline" size={26} color={Colors.white} />
                <Text style={styles.seekLabel}>+10s</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Scrubber & Timecode Bar */}
            <View style={styles.bottomScrubberContainer}>
              <View style={styles.timecodeRow}>
                <Text style={styles.timecodeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timecodeText}>{formatTime(duration)}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={1}
                style={styles.scrubberTrack}
                onPress={handleSeek}
              >
                <View style={[styles.scrubberFill, { width: `${progressPercent}%` }]} />
                <View style={[styles.scrubberKnob, { left: `${Math.min(98, Math.max(0, progressPercent))}%` }]} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    backgroundColor: '#000',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  controlCircleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekLabel: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
    marginTop: -2,
  },
  playCircleBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomScrubberContainer: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
  },
  timecodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timecodeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  scrubberTrack: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    justifyContent: 'center',
  },
  scrubberFill: {
    height: 12,
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  scrubberKnob: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
    marginTop: -2,
  },
  errorText: {
    color: Colors.textMuted,
    marginTop: 8,
    fontSize: 14,
  },
});

export default VideoPlayerItem;
