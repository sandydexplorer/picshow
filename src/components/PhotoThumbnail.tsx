import React, { memo } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { Photo } from '../hooks/usePhotos';

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
  thumbSize: number;
  cols: number;
  gap?: number;
}

const PhotoThumbnail: React.FC<Props> = memo(({
  photo, isSelected, isSelecting, onPress, onLongPress, index, thumbSize, cols, gap = 2
}) => {
  const col = index % cols;
  const marginRight = col < cols - 1 ? gap : 0;
  const marginBottom = gap;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.container, { width: thumbSize, height: thumbSize, marginRight, marginBottom }]}
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
}, (prevProps, nextProps) => {
  return (
    prevProps.photo.id === nextProps.photo.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isSelecting === nextProps.isSelecting &&
    prevProps.thumbSize === nextProps.thumbSize &&
    prevProps.cols === nextProps.cols
  );
});

const styles = StyleSheet.create({
  container: {
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

export default PhotoThumbnail;
