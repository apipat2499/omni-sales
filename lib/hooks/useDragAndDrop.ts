import { useState, useCallback, useRef } from 'react';

export interface DragItem<T extends { id: string }> {
  id: string;
  data: T;
  index: number;
}

export interface DragState<T extends { id: string }> {
  items: T[];
  draggedItem: DragItem<T> | null;
  dragOverIndex: number | null;
  isDragging: boolean;
}

/**
 * Hook for drag-and-drop list reordering
 */
export function useDragAndDrop<T extends { id: string }>(initialItems: T[]) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [draggedItem, setDraggedItem] = useState<DragItem<T> | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragImageRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((index: number) => {
    const item = items[index];
    setDraggedItem({
      id: item.id,
      data: item,
      index,
    });
  }, [items]);

  const handleDragOver = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((targetIndex: number) => {
    if (!draggedItem) return;

    if (draggedItem.index === targetIndex) {
      // No change
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder items
    const newItems = [...items];
    const [moved] = newItems.splice(draggedItem.index, 1);
    newItems.splice(targetIndex, 0, moved);

    setItems(newItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  }, [draggedItem, items]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setItems(newItems);
  }, [items]);

  const swapItems = useCallback((index1: number, index2: number) => {
    const newItems = [...items];
    [newItems[index1], newItems[index2]] = [newItems[index2], newItems[index1]];
    setItems(newItems);
  }, [items]);

  const moveUp = useCallback((index: number) => {
    if (index > 0) {
      moveItem(index, index - 1);
    }
  }, [moveItem]);

  const moveDown = useCallback((index: number) => {
    if (index < items.length - 1) {
      moveItem(index, index + 1);
    }
  }, [moveItem]);

  const moveToStart = useCallback((index: number) => {
    moveItem(index, 0);
  }, [moveItem]);

  const moveToEnd = useCallback((index: number) => {
    moveItem(index, items.length - 1);
  }, [moveItem]);

  return {
    items,
    setItems,
    draggedItem,
    dragOverIndex,
    isDragging: draggedItem !== null,
    handlers: {
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
      onDragEnd: handleDragEnd,
    },
    actions: {
      moveItem,
      swapItems,
      moveUp,
      moveDown,
      moveToStart,
      moveToEnd,
    },
    dragImageRef,
  };
}

/**
 * Reorder array utility
 */
export function reorderArray<T>(
  array: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Move array item up
 */
export function moveArrayItemUp<T>(array: T[], index: number): T[] {
  if (index <= 0) return array;
  return reorderArray(array, index, index - 1);
}

/**
 * Move array item down
 */
export function moveArrayItemDown<T>(array: T[], index: number): T[] {
  if (index >= array.length - 1) return array;
  return reorderArray(array, index, index + 1);
}

/**
 * Move array item to start
 */
export function moveArrayItemToStart<T>(array: T[], index: number): T[] {
  if (index === 0) return array;
  return reorderArray(array, index, 0);
}

/**
 * Move array item to end
 */
export function moveArrayItemToEnd<T>(array: T[], index: number): T[] {
  if (index === array.length - 1) return array;
  return reorderArray(array, index, array.length - 1);
}
