import { useState, useCallback } from 'react';
import {
  requestPermissionsAsync,
  getAssetsAsync,
  getAlbumsAsync,
  getAssetInfoAsync,
  MediaType,
  SortBy,
} from 'expo-media-library/legacy';
import { SecureStorage } from '../utils/secureStorage';

export interface Photo {
  id: string;
  uri: string;
  filename: string;
  creationTime: number;
  width: number;
  height: number;
  mediaType?: 'photo' | 'video';
  duration?: number;
  albumId?: string;
}

export interface DeviceAlbum {
  id: string;
  title: string;
  assetCount: number;
  coverUri?: string;
}

const PAGE_SIZE = 100;

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<DeviceAlbum[]>([]);
  const [excludedFolderIds, setExcludedFolderIds] = useState<Set<string>>(new Set());
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    const { status } = await requestPermissionsAsync(false, ['photo', 'video']);
    setHasPermission(status === 'granted');
    return status === 'granted';
  }, []);

  const loadExcludedFolders = useCallback(async () => {
    const raw = await SecureStorage.get(SecureStorage.keys.EXCLUDED_FOLDERS);
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        setExcludedFolderIds(new Set(arr));
      } catch {}
    }
  }, []);

  const toggleFolderVisibility = useCallback(async (folderId: string) => {
    setExcludedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      SecureStorage.set(SecureStorage.keys.EXCLUDED_FOLDERS, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const loadAlbums = useCallback(async () => {
    try {
      await loadExcludedFolders();
      const result = await getAlbumsAsync({ includeSmartAlbums: true });
      const deviceAlbums: DeviceAlbum[] = [];

      for (const album of result) {
        let coverUri: string | undefined;
        try {
          const sample = await getAssetsAsync({
            album: album.id,
            first: 1,
            mediaType: [MediaType.photo, MediaType.video],
          });
          if (sample.assets.length > 0) {
            coverUri = sample.assets[0].uri;
          }
        } catch {}

        deviceAlbums.push({
          id: album.id,
          title: album.title,
          assetCount: album.assetCount ?? 0,
          coverUri,
        });
      }

      // Sort albums by asset count descending
      deviceAlbums.sort((a, b) => b.assetCount - a.assetCount);
      setAlbums(deviceAlbums);
    } catch (e) {
      console.warn('loadAlbums error:', e);
    }
  }, [loadExcludedFolders]);

  const loadPhotos = useCallback(async (
    reset = false,
    albumId: string | null = selectedAlbumId,
  ) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);
    const cursor = reset ? undefined : endCursor;
    try {
      const options: any = {
        first: PAGE_SIZE,
        mediaType: [MediaType.photo, MediaType.video],
        // Sort by modificationTime descending so WhatsApp & downloaded photos with missing EXIF creationTime sort newest-first
        sortBy: [[SortBy.modificationTime, false]],
      };
      if (cursor) options.after = cursor;
      if (albumId) options.album = albumId;

      const result = await getAssetsAsync(options);

      // Filter out assets belonging to excluded folders when viewing "All Photos"
      const filteredAssets = result.assets.filter(asset => {
        if (!albumId && asset.albumId && excludedFolderIds.has(asset.albumId)) {
          return false;
        }
        return true;
      });

      const newPhotos: Photo[] = filteredAssets.map(asset => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        creationTime: asset.creationTime,
        width: asset.width,
        height: asset.height,
        mediaType: asset.mediaType === 'video' ? 'video' : 'photo',
        duration: asset.duration,
        albumId: asset.albumId,
      }));

      setPhotos(prev => reset ? newPhotos : [...prev, ...newPhotos]);
      setEndCursor(result.endCursor);
      setHasMore(result.hasNextPage);
    } catch (e) {
      console.error('loadPhotos error:', e);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, endCursor, selectedAlbumId, excludedFolderIds]);

  const selectAlbum = useCallback((albumId: string | null) => {
    setSelectedAlbumId(albumId);
    setPhotos([]);
    setEndCursor(undefined);
    setHasMore(true);
  }, []);

  const getPhotosByIds = useCallback(async (ids: string[]): Promise<Photo[]> => {
    const results: Photo[] = [];
    for (const id of ids) {
      try {
        const info = await getAssetInfoAsync(id);
        if (info) {
          results.push({
            id: info.id,
            uri: info.localUri || info.uri,
            filename: info.filename || '',
            creationTime: info.creationTime || 0,
            width: info.width || 0,
            height: info.height || 0,
            mediaType: info.mediaType === 'video' ? 'video' : 'photo',
            duration: info.duration,
          });
        }
      } catch (e) {
        console.warn('getAssetInfoAsync error:', id, e);
      }
    }
    return results;
  }, []);

  return {
    photos,
    albums,
    excludedFolderIds,
    hasPermission,
    loading,
    hasMore,
    selectedAlbumId,
    requestPermission,
    loadPhotos,
    loadAlbums,
    loadExcludedFolders,
    toggleFolderVisibility,
    selectAlbum,
    getPhotosByIds,
  };
}
