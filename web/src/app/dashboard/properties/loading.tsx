import { BrandLoader } from "@/components/ui/brand-loader";

export default function DashboardPropertiesLoading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center py-12">
      <BrandLoader
        variant="fullscreen"
        message="Loading property portfolio..."
        submessage="Fetching property statuses, room inventory, and management records"
      />
    </div>
  );
}
