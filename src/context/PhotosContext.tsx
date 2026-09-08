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

interface AlbumPhotosResult {
  photos: Photo[];
  hasMore: boolean;
  endCursor?: string;
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
  loadPhotosForAlbum: (albumId: string, pageSize?: number, cursor?: string) => Promise<AlbumPhotosResult>;
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
        // Excluded folders active: fetch ALL assets with standard pagination,
        // then filter out excluded folder items client-side.
        const options: any = {
          first: PAGE_SIZE,
          mediaType: [MediaType.photo, MediaType.video],
          sortBy: [[SortBy.modificationTime, false]],
        };
        if (cursor) options.after = cursor;

        // We need to know which album each asset belongs to.
        // Fetch a larger batch to ensure we get enough after filtering.
        const batchSize = PAGE_SIZE * 3;
        options.first = batchSize;

        // Build a set of asset IDs that belong to excluded folders
        let currentAlbums = albums;
        if (currentAlbums.length === 0) {
          const rawAlbums = await getAlbumsAsync({ includeSmartAlbums: true });
          currentAlbums = rawAlbums.map(a => ({ id: a.id, title: a.title, assetCount: a.assetCount ?? 0 }));
        }

        const excludedAssetIds = new Set<string>();
        const excludedAlbumsList = currentAlbums.filter(a => excludedFolderIds.has(a.id));

        // Fetch all asset IDs from excluded folders (in parallel, small batches)
        await Promise.all(
          excludedAlbumsList.map(async (alb) => {
            try {
              let exCursor: string | undefined;
              let exHasMore = true;
              while (exHasMore) {
                const exOpts: any = {
                  album: alb.id,
                  first: 500,
                  mediaType: [MediaType.photo, MediaType.video],
                };
                if (exCursor) exOpts.after = exCursor;
                const exResult = await getAssetsAsync(exOpts);
                for (const a of exResult.assets) excludedAssetIds.add(a.id);
                exHasMore = exResult.hasNextPage;
                exCursor = exResult.endCursor;
              }
            } catch {}
          })
        );

        // Now paginate through ALL assets, filtering out excluded ones
        const result = await getAssetsAsync(options);
        fetchedAssets = result.assets.filter(a => !excludedAssetIds.has(a.id));
        nextHasMore = result.hasNextPage;
        nextCursor = result.endCursor;
      } else {
        // Standard query (no exclusions or specific album selected)
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

  // Standalone album photo fetcher for AlbumDetailScreen (doesn't touch global photos state)
  const loadPhotosForAlbum = useCallback(async (
    albumId: string,
    pageSize = 100,
    cursor?: string,
  ): Promise<AlbumPhotosResult> => {
    try {
      const options: any = {
        album: albumId,
        first: pageSize,
        mediaType: [MediaType.photo, MediaType.video],
        sortBy: [[SortBy.modificationTime, false]],
      };
      if (cursor) options.after = cursor;

      const result = await getAssetsAsync(options);
      const photos: Photo[] = result.assets.map(asset => ({
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
      return { photos, hasMore: result.hasNextPage, endCursor: result.endCursor };
    } catch (e) {
      console.warn('loadPhotosForAlbum error:', e);
      return { photos: [], hasMore: false };
    }
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
      loadPhotosForAlbum,
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
