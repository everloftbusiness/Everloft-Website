import { BrandLoader } from "@/components/ui/brand-loader";

export default function PropertyDetailLoading() {
  return (
    <div className="site-container flex min-h-[75vh] flex-col items-center justify-center pt-28 pb-20">
      <BrandLoader
        variant="fullscreen"
        message="Loading stay details..."
        submessage="Gathering amenities, gallery, pricing, and availability"
      />
    </div>
  );
}
