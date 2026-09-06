export const CHANNEL_COLORS = {
  airbnb: "#FF5A5F",
  booking_com: "#003580",
  makemytrip: "#E34F4F",
  agoda: "#7C3AED",
  vrbo: "#2563EB",
  direct: "#047857",
} as const;

export function channelKey(channelName: string | null | undefined): keyof typeof CHANNEL_COLORS {
  const channel = (channelName || "").toLowerCase();
  if (channel.includes("airbnb")) return "airbnb";
  if (channel.includes("booking")) return "booking_com";
  if (channel.includes("makemytrip")) return "makemytrip";
  if (channel.includes("agoda")) return "agoda";
  if (channel.includes("vrbo")) return "vrbo";
  return "direct";
}

export function defaultChannelColor(channelName: string | null | undefined): string {
  return CHANNEL_COLORS[channelKey(channelName)];
}
