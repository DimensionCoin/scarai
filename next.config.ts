const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.jup.ag" },
      { protocol: "https", hostname: "ipfs.io" },
      { protocol: "https", hostname: "**.irys.xyz" },
      { protocol: "https", hostname: "**.mypinata.cloud" },
      { protocol: "https", hostname: "**.nftstorage.link" },
      { protocol: "https", hostname: "**.arweave.net" },
    ],
    domains: [
      "coin-images.coingecko.com",
      "assets.coingecko.com",
      "img.clerk.com",
      "static.alchemyapi.io",
      "static.jup.ag",
      "ipfs.io",
      "arweave.net",
      "bafkreigfuq6m47yvyysphjuzziegrxaxeeyfm2bv25tsrxqddreenfss44.ipfs.nftstorage.link",
      "i.imgur.com",
    ],
    unoptimized: true, // ✅ Allow large images without Next.js optimizations
  },
};

export default nextConfig;
