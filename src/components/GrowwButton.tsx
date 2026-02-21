import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  symbol: string;
}

const getGrowwSymbol = (symbol: string): string => {
  return symbol.replace(/\.(NS|BO|BSE)$/i, "").toLowerCase();
};

const isMobileOrTablet = (): boolean => {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
};

const isAndroid = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

const isIOS = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

const GrowwButton = ({ symbol }: Props) => {
  const growwSymbol = getGrowwSymbol(symbol);
  const webUrl = `https://groww.in/stocks/${growwSymbol}`;
  const deepLink = `groww://stocks/${growwSymbol}`;
  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.nextbillion.groww";
  const appStoreUrl = "https://apps.apple.com/in/app/groww-stocks-mutual-fund/id1404871703";

  const handleClick = () => {
    if (isMobileOrTablet()) {
      // Try deep link first
      const start = Date.now();
      const timeout = setTimeout(() => {
        const elapsed = Date.now() - start;
        // If more than 2s passed, app likely didn't open — redirect to store
        if (elapsed < 2500) {
          if (isAndroid()) {
            window.open(playStoreUrl, "_blank", "noopener,noreferrer");
          } else if (isIOS()) {
            window.open(appStoreUrl, "_blank", "noopener,noreferrer");
          } else {
            window.open(webUrl, "_blank", "noopener,noreferrer");
          }
        }
      }, 1500);

      window.location.href = deepLink;

      // If app opens, the page blurs — clear the fallback
      window.addEventListener("blur", () => clearTimeout(timeout), { once: true });
    } else {
      // Desktop: open Groww website
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
    >
      <span className="font-bold text-base leading-none">G</span>
      Trade on Groww
      <ExternalLink className="w-3 h-3" />
    </Button>
  );
};

export default GrowwButton;
