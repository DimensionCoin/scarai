/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.jup.ag" },
      { protocol: "https", hostname: "ipfs.io" },
      { protocol: "https", hostname: "**.irys.xyz" },
      { protocol: "https", hostname: "**.mypinata.cloud" },
      { protocol: "https", hostname: "**.nftstorage.link" },
      { protocol: "https", hostname: "**.arweave.net" },
      { protocol: "https", hostname: "coin-images.coingecko.com" },
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "static.alchemyapi.io" },
      { protocol: "https", hostname: "static.jup.ag" },
      {
        protocol: "https",
        hostname:
          "bafkreigfuq6m47yvyysphjuzziegrxaxeeyfm2bv25tsrxqddreenfss44.ipfs.nftstorage.link",
      },
      { protocol: "https", hostname: "i.imgur.com" },
      // Add Twitter (X) profile image domain
      { protocol: "https", hostname: "pbs.twimg.com" },
    ],
    unoptimized: true, // Allow large images without Next.js optimizations
  },
};

export default nextConfig;
