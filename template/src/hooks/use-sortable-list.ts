import {
  closestCenter,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export { closestCenter };
export { DndContext } from "@dnd-kit/core";
export {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface UseSortableListOptions {
  items: { id: string }[];
  move: (from: number, to: number) => void;
}

export function useSortableList({ items, move }: UseSortableListOptions) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      move(oldIndex, newIndex);
    }
  };

  return { sensors, handleDragEnd };
}
