import React, { memo } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { Photo } from '../hooks/usePhotos';

const { width } = Dimensions.get('window');
const COLS = 3;
const GAP = 2;
const THUMB_SIZE = (width - GAP * (COLS - 1)) / COLS;

function formatDuration(sec?: number) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

interface Props {
  photo: Photo;
  isSelected: boolean;
  isSelecting: boolean;
  onPress: () => void;
  onLongPress: () => void;
  index: number;
}

const PhotoThumbnail: React.FC<Props> = memo(({
  photo, isSelected, isSelecting, onPress, onLongPress, index
}) => {
  const col = index % COLS;
  const marginRight = col < COLS - 1 ? GAP : 0;
  const marginBottom = GAP;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.container, { marginRight, marginBottom }]}
    >
      <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />

      {/* Video Badge */}
      {photo.mediaType === 'video' && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={10} color={Colors.white} />
          {Boolean(photo.duration) && (
            <Text style={styles.videoDuration}>{formatDuration(photo.duration)}</Text>
          )}
        </View>
      )}

      {/* Selection overlay */}
      {isSelecting && (
        <View style={[styles.selectionOverlay, isSelected && styles.selectionOverlayActive]}>
          {isSelected && (
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={16} color={Colors.white} />
            </View>
          )}
        </View>
      )}

      {!isSelected && isSelecting && (
        <View style={styles.emptyCheckCircle} />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDuration: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 6,
  },
  selectionOverlayActive: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 6,
    right: 6,
  },
  emptyCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.white,
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

export { THUMB_SIZE, COLS, GAP };
export default PhotoThumbnail;
