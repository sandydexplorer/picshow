import React, { useEffect, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

interface Props {
  uri: string;
  isActive: boolean;
  onToggleUI?: () => void;
}

const VideoPlayerItem: React.FC<Props> = ({ uri, isActive, onToggleUI }) => {
  const { width, height } = useWindowDimensions();
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);

  const player = useVideoPlayer(uri, p => {
    p.loop = true;
  });

  useEffect(() => {
    if (!player) return;
    try {
      if (isActive) {
        player.play();
        setIsPlaying(true);
      } else {
        player.pause();
        setIsPlaying(false);
      }
    } catch (e) {
      console.warn('VideoPlayer error:', e);
      setHasError(true);
    }
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
    } catch (e) {
      console.warn('togglePlayPause error:', e);
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
      {/* Custom Tap Overlay for play/pause toggle without interfering with PagerView swipe gestures */}
      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={() => {
          togglePlayPause();
          onToggleUI?.();
        }}
      >
        {!isPlaying && (
          <View style={styles.playButtonOverlay}>
            <View style={styles.playButtonCircle}>
              <Ionicons name="play" size={36} color={Colors.white} style={{ marginLeft: 4 }} />
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
  playButtonOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  errorText: {
    color: Colors.textMuted,
    marginTop: 8,
    fontSize: 14,
  },
});

export default VideoPlayerItem;
