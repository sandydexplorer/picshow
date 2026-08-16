import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, StatusBar, Text, TouchableOpacity, Image, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import * as Sharing from 'expo-sharing';
import { Colors, Typography, Spacing } from '../theme';
import { Photo } from '../hooks/usePhotos';
import ZoomableImage from '../components/ZoomableImage';
import VideoPlayerItem from '../components/VideoPlayerItem';

interface RouteParams {
  photos: Photo[];
  initialIndex: number;
}

const PhotoViewerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { photos, initialIndex } = route.params as RouteParams;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showUI, setShowUI] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  const current = photos[currentIndex];
  const dateStr = current
    ? new Date(current.creationTime).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  const toggleUI = useCallback(() => {
    if (!isZoomed) setShowUI(v => !v);
  }, [isZoomed]);

  const handleShare = useCallback(async () => {
    if (!current) return;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(current.uri);
      }
    } catch (e) {
      console.warn('Share error:', e);
    }
  }, [current]);

  return (
    <View style={styles.container}>
      <StatusBar hidden={!showUI} />

      {/* Header */}
      {showUI && (
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerDate}>{dateStr}</Text>
            <Text style={styles.headerCounter}>{currentIndex + 1} / {photos.length}</Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Pager — virtualized 3-page windowing with single active VideoPlayer instance */}
      <PagerView
        style={styles.pager}
        initialPage={initialIndex}
        scrollEnabled={!isZoomed}
        onPageSelected={e => {
          setCurrentIndex(e.nativeEvent.position);
          setIsZoomed(false);
        }}
      >
        {photos.map((photo, i) => {
          const isNearby = Math.abs(i - currentIndex) <= 1;
          const isActive = i === currentIndex;
          return (
            <View key={photo.id} style={styles.page}>
              {isNearby ? (
                <>
                  <TouchableOpacity activeOpacity={1} onPress={toggleUI} style={StyleSheet.absoluteFill} />
                  {photo.mediaType === 'video' ? (
                    isActive ? (
                      <VideoPlayerItem
                        uri={photo.uri}
                        isActive={true}
                        onToggleUI={toggleUI}
                      />
                    ) : (
                      <View style={[styles.videoPreviewWrap, { width, height }]}>
                        <Image source={{ uri: photo.uri }} style={[styles.image, { width, height }]} resizeMode="contain" />
                        <View style={styles.playBadge}>
                          <Ionicons name="play" size={32} color={Colors.white} style={{ marginLeft: 2 }} />
                        </View>
                      </View>
                    )
                  ) : (
                    <ZoomableImage
                      uri={photo.uri}
                      onZoomChange={setIsZoomed}
                    />
                  )}
                </>
              ) : null}
            </View>
          );
        })}
      </PagerView>

      {/* Bottom info */}
      {showUI && !isZoomed && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={styles.filename} numberOfLines={1}>{current?.filename}</Text>
          <Text style={styles.hint}>Pinch to zoom • Double tap to zoom</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backBtn: { padding: 4, width: 44 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerDate: {
    color: Colors.textPrimary, fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },
  headerCounter: { color: Colors.textSecondary, fontSize: Typography.fontSizeXS },
  shareBtn: { padding: 4, width: 44, alignItems: 'flex-end' },
  pager: { flex: 1 },
  page: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  videoPreviewWrap: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  image: {},
  playBadge: {
    position: 'absolute', width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
    alignItems: 'center', gap: 4,
  },
  filename: { color: Colors.textSecondary, fontSize: Typography.fontSizeXS },
  hint: { color: Colors.textMuted, fontSize: Typography.fontSizeXS },
});

export default PhotoViewerScreen;
