import { SettingsLocation } from "@/components/settings-location";
import { getViewerSavedLocation, requireViewer } from "@/lib/data/marketplace";
import { isMapboxConfigured } from "@/lib/geo";

export const metadata = {
  title: "Settings · BARTER",
};

export default async function SettingsPage() {
  await requireViewer("/settings");
  const location = await getViewerSavedLocation();
  const hasLocation = Boolean(location && location.latitude != null && location.longitude != null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-black">Settings</h1>
        <p className="mt-1.5 text-neutral-500">Manage how you meet up for local trades.</p>
      </header>
      <SettingsLocation
        initialLabel={location?.label ?? null}
        hasLocation={hasLocation}
        mapboxConfigured={isMapboxConfigured()}
      />
    </div>
  );
}
