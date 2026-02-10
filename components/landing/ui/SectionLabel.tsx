export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs font-medium uppercase tracking-[0.2em] text-[#8B5CF6] mb-4">
      {children}
    </span>
  );
}
