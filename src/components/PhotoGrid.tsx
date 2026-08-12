import React, { useCallback } from 'react';
import { FlatList, View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import PhotoThumbnail, { THUMB_SIZE, GAP } from './PhotoThumbnail';
import { Photo } from '../hooks/usePhotos';
import { Colors, Typography } from '../theme';

interface Props {
  photos: Photo[];
  loading: boolean;
  hasMore: boolean;
  selectedPhotoIds: Set<string>;
  isSelecting: boolean;
  onPhotoPress: (photo: Photo, index: number) => void;
  onPhotoLongPress: (photo: Photo) => void;
  onLoadMore: () => void;
}

const COLS = 3;

const PhotoGrid: React.FC<Props> = ({
  photos, loading, hasMore,
  selectedPhotoIds, isSelecting,
  onPhotoPress, onPhotoLongPress, onLoadMore,
}) => {
  const renderItem = useCallback(({ item, index }: { item: Photo; index: number }) => (
    <PhotoThumbnail
      key={item.id}
      photo={item}
      index={index}
      isSelected={selectedPhotoIds.has(item.id)}
      isSelecting={isSelecting}
      onPress={() => onPhotoPress(item, index)}
      onLongPress={() => onPhotoLongPress(item)}
    />
  ), [selectedPhotoIds, isSelecting, onPhotoPress, onPhotoLongPress]);

  const keyExtractor = useCallback((item: Photo) => item.id, []);

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No photos found</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={photos}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={COLS}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.row}
      onEndReached={() => hasMore && onLoadMore()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      removeClippedSubviews
      initialNumToRender={30}
      maxToRenderPerBatch={30}
      windowSize={10}
      getItemLayout={(_, index) => ({
        length: THUMB_SIZE + GAP,
        offset: (THUMB_SIZE + GAP) * Math.floor(index / COLS),
        index,
      })}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingBottom: 120,
  },
  row: {
    gap: GAP,
  },
  loader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeMD,
  },
});

export default PhotoGrid;
