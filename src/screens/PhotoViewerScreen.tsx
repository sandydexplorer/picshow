import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, Dimensions, Platform, StatusBar, Text, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { Colors, Typography, Spacing } from '../theme';
import { Photo } from '../hooks/usePhotos';
import ZoomableImage from '../components/ZoomableImage';



interface RouteParams {
  photos: Photo[];
  initialIndex: number;
}

const PhotoViewerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
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
          <View style={{ width: 44 }} />
        </View>
      )}

      {/* Pager — scrollEnabled only when not zoomed */}
      <PagerView
        style={styles.pager}
        initialPage={initialIndex}
        scrollEnabled={!isZoomed}
        onPageSelected={e => {
          setCurrentIndex(e.nativeEvent.position);
          setIsZoomed(false);
        }}
      >
        {photos.map((photo) => (
          <View key={photo.id} style={styles.page}>
            <TouchableOpacity activeOpacity={1} onPress={toggleUI} style={StyleSheet.absoluteFill} />
            <ZoomableImage
              uri={photo.uri}
              onZoomChange={setIsZoomed}
            />
          </View>
        ))}
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
  pager: { flex: 1 },
  page: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
