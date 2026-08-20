import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Modal, TextInput, ScrollView, Alert, BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { useSafeShow } from '../context/SafeShowContext';
import { usePhotos, Photo } from '../hooks/usePhotos';
import PhotoGrid from '../components/PhotoGrid';
import SafeShowBanner from '../components/SafeShowBanner';

const { width } = Dimensions.get('window');

const GalleryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const {
    photos, loading, hasMore, albums,
    hasPermission, requestPermission, loadPhotos, loadAlbums,
    selectedAlbumId, selectAlbum, excludedFolderIds, loadExcludedFolders,
  } = usePhotos();

  const {
    selectedPhotoIds, isSelecting,
    togglePhotoSelection, startSelecting, clearSelection,
    activateSafeShow, saveAlbum,
  } = useSafeShow();

  const [saveAlbumVisible, setSaveAlbumVisible] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [showAlbumBar, setShowAlbumBar] = useState(false);

  useEffect(() => {
    (async () => {
      const granted = await requestPermission();
      if (granted) {
        await loadExcludedFolders();
        loadAlbums();
      }
    })();
  }, []);

  // Sync selected album from navigation parameters (e.g. when coming from AlbumsScreen)
  useEffect(() => {
    if (route.params?.albumId !== undefined) {
      selectAlbum(route.params.albumId);
    }
  }, [route.params?.albumId, selectAlbum]);

  // Hardware Back button handling when inside an album filter
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedAlbumId !== null) {
        selectAlbum(null);
        const fromTab = route.params?.fromTab;
        navigation.setParams({ albumId: undefined, albumTitle: undefined, fromTab: undefined });
        if (fromTab === 'Albums') {
          navigation.navigate('Albums');
        }
        return true; // handled
      }
      return false;
    });
    return () => sub.remove();
  }, [selectedAlbumId, selectAlbum, navigation, route.params?.fromTab]);

  // Reload photos when album selection, folder exclusions, or permission changes
  useEffect(() => {
    if (hasPermission) {
      loadPhotos(true, selectedAlbumId);
    }
  }, [selectedAlbumId, hasPermission, excludedFolderIds]);

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

  const handleStartSafeShow = useCallback(() => {
    const ids = Array.from(selectedPhotoIds);
    if (ids.length === 0) return;
    const selectedPhotos = photos.filter(p => selectedPhotoIds.has(p.id));
    activateSafeShow(ids, selectedPhotos);
    navigation.navigate('SafeShow');
  }, [selectedPhotoIds, photos, activateSafeShow, navigation]);

  const handleSaveAlbum = useCallback(() => {
    setSaveAlbumVisible(true);
    setAlbumName('');
  }, []);

  const handleConfirmSaveAlbum = useCallback(async () => {
    if (!albumName.trim()) return;
    const ids = Array.from(selectedPhotoIds);
    const cover = photos.find(p => ids[0] === p.id)?.uri;
    await saveAlbum(albumName.trim(), ids, cover);
    setSaveAlbumVisible(false);
    clearSelection();
    Alert.alert('Album Saved!', `"${albumName.trim()}" saved with ${ids.length} photo${ids.length > 1 ? 's' : ''}.`);
  }, [albumName, selectedPhotoIds, photos, saveAlbum, clearSelection]);

  const selectedAlbumTitle = selectedAlbumId
    ? (albums.find(a => a.id === selectedAlbumId)?.title ?? 'Album')
    : 'All Photos';

  if (hasPermission === false) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="images-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.permTitle}>Photo Access Needed</Text>
        <Text style={styles.permSub}>Grant permission to view your photos</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {selectedAlbumId !== null && !isSelecting && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                selectAlbum(null);
                const fromTab = route.params?.fromTab;
                navigation.setParams({ albumId: undefined, albumTitle: undefined, fromTab: undefined });
                if (fromTab === 'Albums') {
                  navigation.navigate('Albums');
                }
              }}
            >
              <Ionicons name="chevron-back" size={22} color={Colors.primary} />
            </TouchableOpacity>
          )}
          {/* Album selector button */}
          <TouchableOpacity
            style={styles.albumSelector}
            onPress={() => setShowAlbumBar(v => !v)}
          >
            <Text style={styles.albumSelectorText} numberOfLines={1}>
              {isSelecting ? 'Select Photos' : selectedAlbumTitle}
            </Text>
            {!isSelecting && (
              <Ionicons
                name={showAlbumBar ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.primary}
              />
            )}
          </TouchableOpacity>
          {!isSelecting && (
            <Text style={styles.headerSub}>{photos.length} photos</Text>
          )}
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

      {/* Album filter bar (dropdown) */}
      {showAlbumBar && !isSelecting && (
        <View style={styles.albumBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumScrollContent}>
            <TouchableOpacity
              style={[styles.albumChip, !selectedAlbumId && styles.albumChipActive]}
              onPress={() => { selectAlbum(null); setShowAlbumBar(false); }}
            >
              <Text style={[styles.albumChipText, !selectedAlbumId && styles.albumChipTextActive]}>
                All Photos
              </Text>
            </TouchableOpacity>
            {albums.filter(a => !excludedFolderIds.has(a.id)).map(album => (
              <TouchableOpacity
                key={album.id}
                style={[styles.albumChip, selectedAlbumId === album.id && styles.albumChipActive]}
                onPress={() => { selectAlbum(album.id); setShowAlbumBar(false); }}
              >
                <Text style={[styles.albumChipText, selectedAlbumId === album.id && styles.albumChipTextActive]}
                  numberOfLines={1}>
                  {album.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Photo Grid */}
      <PhotoGrid
        photos={photos}
        loading={loading}
        hasMore={hasMore}
        selectedPhotoIds={selectedPhotoIds}
        isSelecting={isSelecting}
        onPhotoPress={handlePhotoPress}
        onPhotoLongPress={handleLongPress}
        onLoadMore={() => loadPhotos(false, selectedAlbumId)}
      />

      {/* Safe Show Banner */}
      {isSelecting && (
        <SafeShowBanner
          selectedCount={selectedPhotoIds.size}
          onStartSafeShow={handleStartSafeShow}
          onCancel={clearSelection}
          onSaveAlbum={handleSaveAlbum}
        />
      )}

      {/* Save Album Modal */}
      <Modal visible={saveAlbumVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Save as Safe Album</Text>
            <Text style={styles.modalSub}>{selectedPhotoIds.size} photos selected</Text>
            <TextInput
              style={styles.albumInput}
              placeholder="Album name (e.g. Wedding)"
              placeholderTextColor={Colors.textMuted}
              value={albumName}
              onChangeText={setAlbumName}
              autoFocus
              maxLength={40}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setSaveAlbumVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmSaveAlbum}
                style={[styles.modalSaveBtn, !albumName.trim() && { opacity: 0.4 }]}
                disabled={!albumName.trim()}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  backBtn: { paddingRight: 4, paddingVertical: 2 },
  albumSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  albumSelectorText: {
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
  albumBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  albumScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  albumChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
    maxWidth: 150,
  },
  albumChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  albumChipText: { color: Colors.textSecondary, fontSize: Typography.fontSizeSM },
  albumChipTextActive: { color: Colors.primary, fontWeight: Typography.fontWeightSemiBold },
  permTitle: {
    color: Colors.textPrimary, fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold, textAlign: 'center',
  },
  permSub: { color: Colors.textSecondary, fontSize: Typography.fontSizeSM, textAlign: 'center' },
  permBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, marginTop: Spacing.sm,
  },
  permBtnText: { color: Colors.white, fontWeight: Typography.fontWeightBold },
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'center', alignItems: 'center', padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl, padding: Spacing.lg,
    width: '100%', gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  modalTitle: {
    color: Colors.textPrimary, fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },
  modalSub: { color: Colors.textSecondary, fontSize: Typography.fontSizeSM, marginTop: -Spacing.sm },
  albumInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.md,
    color: Colors.textPrimary, fontSize: Typography.fontSizeMD,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },
  modalCancelBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  modalCancelText: { color: Colors.textSecondary, fontSize: Typography.fontSizeMD },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  modalSaveText: { color: Colors.white, fontWeight: Typography.fontWeightBold },
});

export default GalleryScreen;
