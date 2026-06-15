import { useEffect, useRef } from 'react';

/**
 * AdBanner — reusable Google AdSense ad unit.
 *
 * Props:
 *   adSlot   – (optional) your ad-unit slot id. Leave empty for auto ads.
 *   adFormat – (optional) "auto" | "horizontal" | "vertical" | "rectangle"
 *   style    – (optional) custom container styles
 *
 * If you only use Auto Ads (no manual ad units), this component
 * renders an empty placeholder that AdSense will fill automatically.
 * Once you create ad units in your AdSense dashboard, pass the
 * `adSlot` prop to display specific units.
 */
const AdBanner = ({ adSlot, adFormat = 'auto', style = {} }) => {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Only push the ad once per mount
    if (pushed.current) return;

    try {
      if (window.adsbygoogle && adSlot) {
        window.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [adSlot]);

  // If no specific ad slot is provided, AdSense Auto Ads will handle
  // ad placement automatically via the script in <head>. We still
  // render a container as a hint / placeholder.
  if (!adSlot) {
    return (
      <div
        className="ad-banner-container"
        style={{
          width: '100%',
          minHeight: '90px',
          textAlign: 'center',
          overflow: 'hidden',
          ...style,
        }}
      />
    );
  }

  return (
    <div
      className="ad-banner-container"
      style={{
        width: '100%',
        minHeight: '90px',
        textAlign: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-5719665546463228"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        ref={adRef}
      />
    </div>
  );
};

export default AdBanner;
