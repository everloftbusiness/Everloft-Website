import { BrandLoader } from "@/components/ui/brand-loader";

export default function SiteLoading() {
  return (
    <div className="site-container flex min-h-[75vh] items-center justify-center pt-24 pb-16">
      <BrandLoader
        variant="fullscreen"
        message="Loading experience..."
        submessage="Connecting you with verified premium stays"
      />
    </div>
  );
}
