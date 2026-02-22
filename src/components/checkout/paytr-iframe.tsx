"use client";

import Script from "next/script";

interface PaytrIframeProps {
  token: string;
}

export function PaytrIframe({ token }: PaytrIframeProps) {
  return (
    <div className="w-full">
      <Script src="https://www.paytr.com/js/iframeResizer.min.js" strategy="afterInteractive" />
      <iframe
        src={`https://www.paytr.com/odeme/guvenli/${token}`}
        id="paytriframe"
        frameBorder="0"
        scrolling="no"
        style={{ width: "100%", minHeight: 400 }}
      />
    </div>
  );
}
