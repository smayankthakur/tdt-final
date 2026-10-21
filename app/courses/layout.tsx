import BrandFonts from '@/components/system/BrandFonts';

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="brand-fonts">
      <BrandFonts />
      {children}
    </div>
  );
}
