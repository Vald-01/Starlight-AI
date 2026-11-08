import ItemCard from '@/components/ItemCard';

export default function ItemGrid({ items, onOpen, onStar, onCopy, onDelete, onOpenOriginal }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onOpen={() => onOpen(item)}
          onStar={onStar}
          onCopy={onCopy}
          onDelete={onDelete}
          onOpenOriginal={() => onOpenOriginal(item)}
        />
      ))}
    </div>
  );
}