import { BrandLoader } from "@/components/ui/brand-loader";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center py-12">
      <BrandLoader
        variant="fullscreen"
        message="Loading platform overview..."
        submessage="Connecting to database and compiling real-time metrics"
      />
    </div>
  );
}
