export default function MasonryGrid({ children }: any) {
  return (
    <div className="columns-2 md:columns-3 gap-4 space-y-4">
      {children}
    </div>
  );
}