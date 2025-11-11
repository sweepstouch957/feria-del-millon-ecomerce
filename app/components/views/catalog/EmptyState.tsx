export default function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center py-12">
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      {description && <p className="text-gray-500 mt-2">{description}</p>}
    </div>
  );
}
