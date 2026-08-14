import { BrandLoader } from "@/components/ui/brand-loader";

export default function PropertiesLoading() {
  return (
    <div className="site-container flex min-h-[70vh] flex-col items-center justify-center pt-28 pb-20">
      <BrandLoader
        variant="fullscreen"
        message="Loading property collection..."
        submessage="Curating our portfolio of villas, retreats, and boutique suites"
      />
    </div>
  );
}
