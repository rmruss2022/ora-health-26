/**
 * Optimized FlatList Component
 * Implements best practices for smooth 60fps scrolling
 */

import React, { useCallback, useMemo } from 'react';
import { FlatList, FlatListProps, ViewToken } from 'react-native';

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  renderItem: (item: T, index: number) => React.ReactElement;
  data: T[];
  keyExtractor?: (item: T, index: number) => string;
  estimatedItemSize?: number;
}

/**
 * Optimized FlatList with performance enhancements:
 * - Proper keyExtractor memoization
 * - Optimized getItemLayout for consistent item heights
 * - Reduced re-renders with appropriate props
 * - Efficient viewability callbacks
 */
export function OptimizedFlatList<T>({
  renderItem,
  data,
  keyExtractor,
  estimatedItemSize = 80,
  ...props
}: OptimizedFlatListProps<T>) {
  
  /**
   * Memoized render item to prevent unnecessary re-renders
   */
  const memoizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      return renderItem(item, index);
    },
    [renderItem]
  );

  /**
   * Memoized key extractor
   */
  const memoizedKeyExtractor = useCallback(
    (item: T, index: number) => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }
      // Fallback: use index
      return `item-${index}`;
    },
    [keyExtractor]
  );

  /**
   * getItemLayout for performance (requires consistent item heights)
   * Remove this if items have variable heights
   */
  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    }),
    [estimatedItemSize]
  );

  /**
   * Viewability config for efficient rendering
   */
  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 500,
    }),
    []
  );

  /**
   * On viewable items changed (throttled)
   */
  const onViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      // Handle viewability changes if needed
      // This is throttled by viewabilityConfig
    },
    []
  );

  return (
    <FlatList
      {...props}
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={memoizedKeyExtractor}
      getItemLayout={props.getItemLayout || getItemLayout}
      // Performance optimizations
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={5}
      removeClippedSubviews={true}
      // Viewability
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      // Smooth scrolling
      scrollEventThrottle={16}
      // Memory optimization
      persistentScrollbar={true}
    />
  );
}

export default OptimizedFlatList;
