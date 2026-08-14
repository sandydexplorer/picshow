import React, { useCallback } from 'react';
import { FlatList, View, StyleSheet, ActivityIndicator, Text, useWindowDimensions } from 'react-native';
import PhotoThumbnail from './PhotoThumbnail';
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

const PhotoGrid: React.FC<Props> = ({
  photos, loading, hasMore,
  selectedPhotoIds, isSelecting,
  onPhotoPress, onPhotoLongPress, onLoadMore,
}) => {
  const { width } = useWindowDimensions();

  // Dynamic columns: 3 for phones (< 600), 4-5 for small tablets (600-900), 6+ for large tablets/landscape
  const cols = width >= 900 ? 6 : width >= 600 ? 4 : 3;
  const gap = 2;
  const thumbSize = (width - gap * (cols - 1)) / cols;

  const renderItem = useCallback(({ item, index }: { item: Photo; index: number }) => (
    <PhotoThumbnail
      key={item.id}
      photo={item}
      index={index}
      thumbSize={thumbSize}
      cols={cols}
      gap={gap}
      isSelected={selectedPhotoIds.has(item.id)}
      isSelecting={isSelecting}
      onPress={() => onPhotoPress(item, index)}
      onLongPress={() => onPhotoLongPress(item)}
    />
  ), [selectedPhotoIds, isSelecting, onPhotoPress, onPhotoLongPress, thumbSize, cols]);

  const keyExtractor = useCallback((item: Photo) => item.id, []);

  const getItemLayout = useCallback((_: any, index: number) => {
    const rowHeight = thumbSize + gap;
    return {
      length: rowHeight,
      offset: rowHeight * Math.floor(index / cols),
      index,
    };
  }, [thumbSize, gap, cols]);

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
      key={`grid-${cols}`} // Remount on orientation/column changes
      data={photos}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={cols}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.row}
      onEndReached={() => hasMore && onLoadMore()}
      onEndReachedThreshold={0.6}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      removeClippedSubviews
      initialNumToRender={18}
      maxToRenderPerBatch={18}
      windowSize={5}
      getItemLayout={getItemLayout}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingBottom: 120,
  },
  row: {
    gap: 2,
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
