import React, { createContext, useContext, useState, useCallback } from 'react';
import { SecureStorage } from '../utils/secureStorage';
import { Photo } from '../hooks/usePhotos';

export interface SafeAlbum {
  id: string;
  name: string;
  photoIds: string[];
  createdAt: number;
  coverUri?: string;
}

interface SafeShowContextType {
  // Selection
  selectedPhotoIds: Set<string>;
  isSelecting: boolean;
  togglePhotoSelection: (id: string) => void;
  startSelecting: () => void;
  clearSelection: () => void;

  // Safe Show Mode
  isSafeShowActive: boolean;
  safeShowPhotoIds: string[];
  safeShowPhotos: Photo[];
  activateSafeShow: (photoIds: string[], photos?: Photo[]) => void;
  deactivateSafeShow: () => void;

  // Albums
  albums: SafeAlbum[];
  loadAlbums: () => Promise<void>;
  saveAlbum: (name: string, photoIds: string[], coverUri?: string) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
}

const SafeShowContext = createContext<SafeShowContextType>({} as SafeShowContextType);

export const SafeShowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSafeShowActive, setIsSafeShowActive] = useState(false);
  const [safeShowPhotoIds, setSafeShowPhotoIds] = useState<string[]>([]);
  const [safeShowPhotos, setSafeShowPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<SafeAlbum[]>([]);

  const togglePhotoSelection = useCallback((id: string) => {
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const startSelecting = useCallback(() => setIsSelecting(true), []);

  const clearSelection = useCallback(() => {
    setSelectedPhotoIds(new Set());
    setIsSelecting(false);
  }, []);

  const activateSafeShow = useCallback((photoIds: string[], photos?: Photo[]) => {
    setSafeShowPhotoIds(photoIds);
    if (photos) {
      setSafeShowPhotos(photos);
    }
    setIsSafeShowActive(true);
    clearSelection();
  }, [clearSelection]);

  const deactivateSafeShow = useCallback(() => {
    setIsSafeShowActive(false);
    setSafeShowPhotoIds([]);
    setSafeShowPhotos([]);
  }, []);

  const loadAlbums = useCallback(async () => {
    const raw = await SecureStorage.get(SecureStorage.keys.ALBUMS);
    if (raw) {
      try {
        setAlbums(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const saveAlbum = useCallback(async (name: string, photoIds: string[], coverUri?: string) => {
    const newAlbum: SafeAlbum = {
      id: Date.now().toString(),
      name,
      photoIds,
      createdAt: Date.now(),
      coverUri,
    };
    const updated = [...albums, newAlbum];
    setAlbums(updated);
    await SecureStorage.set(SecureStorage.keys.ALBUMS, JSON.stringify(updated));
  }, [albums]);

  const deleteAlbum = useCallback(async (id: string) => {
    const updated = albums.filter(a => a.id !== id);
    setAlbums(updated);
    await SecureStorage.set(SecureStorage.keys.ALBUMS, JSON.stringify(updated));
  }, [albums]);

  return (
    <SafeShowContext.Provider value={{
      selectedPhotoIds, isSelecting,
      togglePhotoSelection, startSelecting, clearSelection,
      isSafeShowActive, safeShowPhotoIds, safeShowPhotos,
      activateSafeShow, deactivateSafeShow,
      albums, loadAlbums, saveAlbum, deleteAlbum,
    }}>
      {children}
    </SafeShowContext.Provider>
  );
};

export const useSafeShow = () => useContext(SafeShowContext);
