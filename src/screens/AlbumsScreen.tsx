import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, useWindowDimensions, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { useSafeShow, SafeAlbum } from '../context/SafeShowContext';
import { usePhotos, DeviceAlbum } from '../hooks/usePhotos';

type TabType = 'device' | 'safe';

const AlbumsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<TabType>('device');

  // Dynamic card layout for phones vs tablets
  const numColumns = width >= 900 ? 5 : width >= 600 ? 3 : 2;
  const cardWidth = (width - Spacing.md * (numColumns + 1)) / numColumns;

  const { albums: safeAlbums, loadAlbums: loadSafeAlbums, deleteAlbum, activateSafeShow } = useSafeShow();
  const { albums: deviceAlbums, loadAlbums: loadDeviceAlbums, selectAlbum, photos, getPhotosByIds } = usePhotos();
  const [refreshing, setRefreshing] = useState(false);

  const initData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadSafeAlbums(), loadDeviceAlbums()]);
    setRefreshing(false);
  }, [loadSafeAlbums, loadDeviceAlbums]);

  useEffect(() => {
    initData();
  }, []);

  const handleDeviceFolderPress = useCallback((folder: DeviceAlbum) => {
    selectAlbum(folder.id);
    navigation.navigate('Gallery', { albumId: folder.id, albumTitle: folder.title });
  }, [selectAlbum, navigation]);

  const handleSafeAlbumPress = useCallback(async (album: SafeAlbum) => {
    Alert.alert(
      album.name,
      `${album.photoIds.length} item${album.photoIds.length !== 1 ? 's' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Album', style: 'destructive', onPress: () => deleteAlbum(album.id) },
        {
          text: '▶ Start Safe Show',
          onPress: async () => {
            const loaded = await getPhotosByIds(album.photoIds);
            activateSafeShow(album.photoIds, loaded);
            navigation.navigate('SafeShow');
          },
        },
      ]
    );
  }, [deleteAlbum, activateSafeShow, getPhotosByIds, navigation]);

  const renderDeviceFolder = ({ item }: { item: DeviceAlbum }) => (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth, height: cardWidth * 1.1 }]}
      onPress={() => handleDeviceFolderPress(item)}
      activeOpacity={0.85}
    >
      {item.coverUri ? (
        <Image source={{ uri: item.coverUri }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardPlaceholder]}>
          <Ionicons name="folder-open-outline" size={42} color={Colors.textMuted} />
        </View>
      )}
      <View style={styles.cardOverlay}>
        <Text style={styles.cardName} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardCount}>{item.assetCount} items</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSafeAlbum = ({ item }: { item: SafeAlbum }) => (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth, height: cardWidth * 1.1 }]}
      onPress={() => handleSafeAlbumPress(item)}
      activeOpacity={0.85}
    >
      {item.coverUri ? (
        <Image source={{ uri: item.coverUri }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardPlaceholder]}>
          <Ionicons name="shield-checkmark-outline" size={42} color={Colors.safeGreen} />
        </View>
      )}
      <View style={styles.cardOverlay}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardCount}>{item.photoIds.length} items</Text>
      </View>
      <View style={styles.safeBadge}>
        <Ionicons name="shield-checkmark" size={14} color={Colors.safeGreen} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Folders & Albums</Text>
        <Text style={styles.headerSub}>Browse device folders and safe collections</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'device' && styles.tabBtnActive]}
          onPress={() => setActiveTab('device')}
        >
          <Ionicons
            name="folder-outline"
            size={16}
            color={activeTab === 'device' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'device' && styles.tabTextActive]}>
            Device Folders ({deviceAlbums.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'safe' && styles.tabBtnActive]}
          onPress={() => setActiveTab('safe')}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={activeTab === 'safe' ? Colors.safeGreen : Colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'safe' && styles.tabTextActiveSafe]}>
            Safe Albums ({safeAlbums.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'device' ? (
        deviceAlbums.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.empty}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={initData} tintColor={Colors.primary} />}
          >
            <Ionicons name="folder-open-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Scanning folders...</Text>
            <Text style={styles.emptySub}>
              Make sure media permissions are granted to view your device folders.
            </Text>
          </ScrollView>
        ) : (
          <FlatList
            key={`dev-folders-${numColumns}`}
            data={deviceAlbums}
            renderItem={renderDeviceFolder}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={initData} tintColor={Colors.primary} />}
          />
        )
      ) : (
        safeAlbums.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.empty}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={initData} tintColor={Colors.primary} />}
          >
            <Ionicons name="bookmark-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Safe Albums yet</Text>
            <Text style={styles.emptySub}>
              Select photos in Gallery and tap "Save Album" to create custom safe collections.
            </Text>
          </ScrollView>
        ) : (
          <FlatList
            key={`safe-albums-${numColumns}`}
            data={safeAlbums}
            renderItem={renderSafeAlbum}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={initData} tintColor={Colors.primary} />}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
  },
  headerSub: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeXS,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  tabBtnActive: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightMedium,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeightBold,
  },
  tabTextActiveSafe: {
    color: Colors.safeGreen,
    fontWeight: Typography.fontWeightBold,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 100,
  },
  row: {
    gap: Spacing.md,
  },
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  cardName: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
  },
  cardCount: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeXS,
    marginTop: 2,
  },
  safeBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: Radius.full,
    padding: 5,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },
  emptySub: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeSM,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AlbumsScreen;
