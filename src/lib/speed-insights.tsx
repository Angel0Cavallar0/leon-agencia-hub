import { useEffect } from "react";

type SpeedInsightsProps = {
  sampleRate?: number;
};

export function SpeedInsights({ sampleRate }: SpeedInsightsProps) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.info(
        "SpeedInsights placeholder active. Replace with actual @vercel/speed-insights package when available.",
        sampleRate
      );
    }
  }, [sampleRate]);

  return null;
}

export default SpeedInsights;
