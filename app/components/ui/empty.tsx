
export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}> = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white py-10 text-center">
    <div className="text-neutral-400">{icon}</div>
    <h4 className="mt-2 text-base font-medium">{title}</h4>
    {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
  </div>
);
