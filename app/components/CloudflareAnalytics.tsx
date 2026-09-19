// This is a public site identifier, not a Cloudflare API token.
const analyticsToken = "430b038461df4770b3b0c08cea7572e6";
const analyticsOrigin = "https://hawks.tw";

// Run before hydration so analytics does not depend on React starting up.
// Cloudflare handles SPA navigation itself; adding route events would double count.
const bootstrap = `(() => {
  if (window.location.origin !== ${JSON.stringify(analyticsOrigin)}) return;
  if (document.querySelector('script[data-cf-beacon]')) return;
  const script = document.createElement('script');
  script.type = 'module';
  script.async = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.setAttribute('data-cf-beacon', ${JSON.stringify(JSON.stringify({ token: analyticsToken }))});
  document.body.appendChild(script);
})();`;

export default function CloudflareAnalytics() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <script
      id="hawks-web-analytics"
      dangerouslySetInnerHTML={{ __html: bootstrap }}
    />
  );
}
