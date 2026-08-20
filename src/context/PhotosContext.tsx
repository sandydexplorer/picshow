import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

interface PhotosContextType {
  photos: Photo[];
  albums: DeviceAlbum[];
  excludedFolderIds: Set<string>;
  hasPermission: boolean | null;
  loading: boolean;
  hasMore: boolean;
  selectedAlbumId: string | null;
  requestPermission: () => Promise<boolean>;
  loadPhotos: (reset?: boolean, albumId?: string | null) => Promise<void>;
  loadAlbums: () => Promise<void>;
  loadExcludedFolders: () => Promise<void>;
  toggleFolderVisibility: (folderId: string) => Promise<void>;
  selectAlbum: (albumId: string | null) => void;
  getPhotosByIds: (ids: string[]) => Promise<Photo[]>;
}

const PhotosContext = createContext<PhotosContextType | undefined>(undefined);
const PAGE_SIZE = 100;

export const PhotosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    } else {
      setExcludedFolderIds(new Set());
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
      let fetchedAssets: any[] = [];
      let nextHasMore = false;
      let nextCursor: string | undefined = undefined;

      if (!albumId && excludedFolderIds.size > 0) {
        // Excluded folders active: fetch assets ONLY from allowed device folders
        let currentAlbums = albums;
        if (currentAlbums.length === 0) {
          const rawAlbums = await getAlbumsAsync({ includeSmartAlbums: true });
          currentAlbums = rawAlbums.map(a => ({ id: a.id, title: a.title, assetCount: a.assetCount ?? 0 }));
        }

        const allowedAlbums = currentAlbums.filter(a => !excludedFolderIds.has(a.id));

        const responses = await Promise.all(
          allowedAlbums.map(alb =>
            getAssetsAsync({
              album: alb.id,
              first: 50,
              mediaType: [MediaType.photo, MediaType.video],
              sortBy: [[SortBy.modificationTime, false]],
            }).catch(() => ({ assets: [], hasNextPage: false, endCursor: undefined }))
          )
        );

        const assetMap = new Map<string, any>();
        for (const resp of responses) {
          if (resp && resp.assets) {
            for (const item of resp.assets) {
              assetMap.set(item.id, item);
            }
          }
        }

        fetchedAssets = Array.from(assetMap.values());
        fetchedAssets.sort((a, b) => (b.modificationTime || b.creationTime || 0) - (a.modificationTime || a.creationTime || 0));
        nextHasMore = false;
      } else {
        // Standard query
        const options: any = {
          first: PAGE_SIZE,
          mediaType: [MediaType.photo, MediaType.video],
          sortBy: [[SortBy.modificationTime, false]],
        };
        if (cursor) options.after = cursor;
        if (albumId) options.album = albumId;

        const result = await getAssetsAsync(options);
        fetchedAssets = result.assets;
        nextHasMore = result.hasNextPage;
        nextCursor = result.endCursor;
      }

      const newPhotos: Photo[] = fetchedAssets.map(asset => ({
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
      setEndCursor(nextCursor);
      setHasMore(nextHasMore);
    } catch (e) {
      console.error('loadPhotos error:', e);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, endCursor, selectedAlbumId, excludedFolderIds, albums]);

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

  useEffect(() => {
    loadExcludedFolders();
  }, [loadExcludedFolders]);

  return (
    <PhotosContext.Provider value={{
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
    }}>
      {children}
    </PhotosContext.Provider>
  );
};

export const usePhotos = () => {
  const context = useContext(PhotosContext);
  if (!context) {
    throw new Error('usePhotos must be used within a PhotosProvider');
  }
  return context;
};
