import { BrandLoader } from "@/components/ui/brand-loader";

export default function RootLoading() {
  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center">
      <BrandLoader
        variant="fullscreen"
        message="Welcoming you to Everloft..."
        submessage="Preparing thoughtful hospitality experiences"
      />
    </div>
  );
}
