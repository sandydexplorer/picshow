import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, useWindowDimensions, RefreshControl, BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { usePhotos, Photo } from '../hooks/usePhotos';
import PhotoGrid from '../components/PhotoGrid';
import { useSafeShow } from '../context/SafeShowContext';

interface RouteParams {
  albumId: string;
  albumTitle: string;
}

const AlbumDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { albumId, albumTitle } = route.params as RouteParams;

  const { loadPhotosForAlbum, getPhotosByIds } = usePhotos();
  const {
    selectedPhotoIds, isSelecting,
    togglePhotoSelection, startSelecting, clearSelection,
    activateSafeShow,
  } = useSafeShow();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPhotos = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);
    const cursor = reset ? undefined : endCursor;
    try {
      const result = await loadPhotosForAlbum(albumId, 100, cursor);
      setPhotos(prev => reset ? result.photos : [...prev, ...result.photos]);
      setEndCursor(result.endCursor);
      setHasMore(result.hasMore);
    } catch (e) {
      console.warn('AlbumDetail fetchPhotos error:', e);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, endCursor, albumId, loadPhotosForAlbum]);

  useEffect(() => {
    fetchPhotos(true);
  }, [albumId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setEndCursor(undefined);
    setHasMore(true);
    try {
      const result = await loadPhotosForAlbum(albumId, 100, undefined);
      setPhotos(result.photos);
      setEndCursor(result.endCursor);
      setHasMore(result.hasMore);
    } catch (e) {
      console.warn('AlbumDetail refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [albumId, loadPhotosForAlbum]);

  const handlePhotoPress = useCallback((photo: Photo, index: number) => {
    if (isSelecting) {
      togglePhotoSelection(photo.id);
    } else {
      navigation.navigate('PhotoViewer', { photos, initialIndex: index });
    }
  }, [isSelecting, togglePhotoSelection, navigation, photos]);

  const handleLongPress = useCallback((photo: Photo) => {
    if (!isSelecting) startSelecting();
    togglePhotoSelection(photo.id);
  }, [isSelecting, startSelecting, togglePhotoSelection]);

  // Handle hardware back
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSelecting) {
        clearSelection();
        return true;
      }
      return false; // let default goBack() work
    });
    return () => sub.remove();
  }, [isSelecting, clearSelection]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>{albumTitle}</Text>
            <Text style={styles.headerSub}>{photos.length} items</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {isSelecting ? (
            <TouchableOpacity onPress={clearSelection}>
              <Text style={styles.cancelSelectText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.selectBtn} onPress={startSelecting}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.selectBtnText}>Select</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Photo Grid */}
      <PhotoGrid
        photos={photos}
        loading={loading}
        hasMore={hasMore}
        selectedPhotoIds={selectedPhotoIds}
        isSelecting={isSelecting}
        onPhotoPress={handlePhotoPress}
        onPhotoLongPress={handleLongPress}
        onLoadMore={() => fetchPhotos(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  backBtn: { paddingRight: 4, paddingVertical: 2 },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    maxWidth: 220,
  },
  headerSub: { color: Colors.textMuted, fontSize: Typography.fontSizeXS },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary,
  },
  selectBtnText: {
    color: Colors.primary, fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },
  cancelSelectText: { color: Colors.textSecondary, fontSize: Typography.fontSizeMD },
});

export default AlbumDetailScreen;
