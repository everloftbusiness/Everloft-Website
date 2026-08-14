import { BrandLoader } from "@/components/ui/brand-loader";

export default function RoleWorkspaceLoading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center py-12">
      <BrandLoader
        variant="fullscreen"
        message="Loading role workspace..."
        submessage="Synchronizing real-time operational feeds, financials, and alerts"
      />
    </div>
  );
}
