import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface Props {
  uri: string;
  isActive: boolean;
  onToggleUI?: () => void;
}

const VideoPlayerItem: React.FC<Props> = ({ uri, isActive }) => {
  const { width, height } = useWindowDimensions();

  const player = useVideoPlayer(uri, p => {
    p.loop = true;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <View style={[styles.container, { width, height }]}>
      <VideoView
        style={[styles.video, { width, height }]}
        player={player}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true, orientation: 'default' }}
        allowsPictureInPicture={false}
      />
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
});

export default VideoPlayerItem;
