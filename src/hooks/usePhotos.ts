import { useState, useCallback } from 'react';
import {
  requestPermissionsAsync,
  getAssetsAsync,
  getAlbumsAsync,
  getAssetInfoAsync,
  MediaType,
  SortBy,
} from 'expo-media-library/legacy';

export interface Photo {
  id: string;
  uri: string;
  filename: string;
  creationTime: number;
  width: number;
  height: number;
  mediaType?: 'photo' | 'video';
  duration?: number;
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    const { status } = await requestPermissionsAsync(false, ['photo']);
    setHasPermission(status === 'granted');
    return status === 'granted';
  }, []);

  const loadAlbums = useCallback(async () => {
    try {
      const result = await getAlbumsAsync({ includeSmartAlbums: false });
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
  }, []);

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

      const newPhotos: Photo[] = result.assets.map(asset => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        creationTime: asset.creationTime,
        width: asset.width,
        height: asset.height,
        mediaType: asset.mediaType === 'video' ? 'video' : 'photo',
        duration: asset.duration,
      }));

      setPhotos(prev => reset ? newPhotos : [...prev, ...newPhotos]);
      setEndCursor(result.endCursor);
      setHasMore(result.hasNextPage);
    } catch (e) {
      console.error('loadPhotos error:', e);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, endCursor, selectedAlbumId]);

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
    hasPermission,
    loading,
    hasMore,
    selectedAlbumId,
    requestPermission,
    loadPhotos,
    loadAlbums,
    selectAlbum,
    getPhotosByIds,
  };
}
