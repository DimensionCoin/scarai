export interface CoinInfo {
  id: string; // Price feed ID
  name: string;
  symbol: string;
  image: string;
}

export const coins: CoinInfo[] = [
  // Original Coins
  {
    id: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    name: "Bitcoin",
    symbol: "BTC",
    image:
      "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400",
  },
  {
    id: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    name: "Ethereum",
    symbol: "ETH",
    image:
      "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628",
  },
  {
    id: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    name: "Solana",
    symbol: "SOL",
    image:
      "https://coin-images.coingecko.com/coins/images/4128/large/solana.png?1718769756",
  },
  {
    id: "0x4279e31cc369bbcc2faf022b382b080e32a8e689ff20fbc530d2a603eb6cd98b",
    name: "Hyperliquid",
    symbol: "HYPE",
    image:
      "https://coin-images.coingecko.com/coins/images/50882/large/hyperliquid.jpg?1729431300",
  },
  {
    id: "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744",
    name: "Sui",
    symbol: "SUI",
    image:
      "https://coin-images.coingecko.com/coins/images/26375/large/sui-ocean-square.png?1727791290",
  },

  // Ethereum Ecosystem Additions
  {
    id: "0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221", // Add Pyth ID later
    name: "Chainlink",
    symbol: "LINK",
    image:
      "https://coin-images.coingecko.com/coins/images/877/large/chainlink-new-logo.png?1696502009",
  },
  {
    id: "0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501", // Add Pyth ID later
    name: "Uniswap",
    symbol: "UNI",
    image:
      "https://coin-images.coingecko.com/coins/images/12504/large/uniswap-logo.png?1720676666",
  },
  {
    id: "0x2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445", // Add Pyth ID later
    name: "Aave",
    symbol: "AAVE",
    image:
      "https://coin-images.coingecko.com/coins/images/12645/large/AAVE.png?1696512452",
  },
  {
    id: "0x9375299e31c0deb9c6bc378e6329aab44cb48ec655552a70d4b9050346a30378", // Add Pyth ID later
    name: "Maker",
    symbol: "MKR",
    image:
      "https://coin-images.coingecko.com/coins/images/1364/large/Mark_Maker.png?1696502423",
  },
  {
    id: "0x4d1f8dae0d96236fb98e8f47471a366ec3b1732b47041781934ca3a9bb2f35e7", // Add Pyth ID later
    name: "The Graph",
    symbol: "GRT",
    image:
      "https://coin-images.coingecko.com/coins/images/13397/large/Graph_Token.png?1696513159",
  },
  {
    id: "0xcf40822c7635ddbde64c831982c65b3b37247f139e8e53078d1602e886badd2f", // Add Pyth ID later
    name: "Lido Staked ETH",
    symbol: "stETH",
    image:
      "https://coin-images.coingecko.com/coins/images/13442/large/steth_logo.png?1696513206",
  },

  // Solana Ecosystem Additions
  {
    id: "0xb43660a5f790c69354b0729a5ef9d50d68f1df92107540210b9cccba1f947cc2", // Add Pyth ID later
    name: "Jito",
    symbol: "JTO",
    image:
      "https://coin-images.coingecko.com/coins/images/33228/large/jto.png?1701137022",
  },
  {
    id: "0x91568baa8beb53db23eb3fb7f22c6e8bd303d103919e19733f2bb642d3e7987a", // Add Pyth ID later
    name: "Raydium",
    symbol: "RAY",
    image:
      "https://coin-images.coingecko.com/coins/images/13928/large/PSigc4ie_400x400.jpg?1696513668",
  },
  {
    id: "0x0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff", // Add Pyth ID later
    name: "Pyth Network",
    symbol: "PYTH",
    image:
      "https://coin-images.coingecko.com/coins/images/31924/large/pyth.png?1701245725",
  },
  {
    id: "0xeff7446475e218517566ea99e72a4abec2e1bd8498b43b7d8331e29dcb059389", // Add Pyth ID later
    name: "Wormhole",
    symbol: "W",
    image:
      "https://coin-images.coingecko.com/coins/images/35087/large/womrhole_logo_full_color_rgb_2000px_72ppi_fb766ac85a.png?1708688954",
  },

  // Other Popular Layer 1 Blockchains
  {
    id: "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f", // Add Pyth ID later
    name: "Binance Coin",
    symbol: "BNB",
    image:
      "https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1696501970",
  },
  {
    id: "0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d", // Add Pyth ID later
    name: "Cardano",
    symbol: "ADA",
    image:
      "https://coin-images.coingecko.com/coins/images/975/large/cardano.png?1696502090",
  },
  {
    id: "0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7", // Add Pyth ID later
    name: "Avalanche",
    symbol: "AVAX",
    image:
      "https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png?1696512369",
  },
  {
    id: "0xca3eed9b267293f6595901c734c7525ce8ef49adafe8284606ceb307afa2ca5b", // Add Pyth ID later
    name: "Polkadot",
    symbol: "DOT",
    image:
      "https://coin-images.coingecko.com/coins/images/12171/large/polkadot.png?1696511988",
  },
  {
    id: "0xb00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819", // Add Pyth ID later
    name: "Cosmos",
    symbol: "ATOM",
    image:
      "https://coin-images.coingecko.com/coins/images/1481/large/cosmos_hub.png?1696502525",
  },
  {
    id: "0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5", // Add Pyth ID later
    name: "Aptos",
    symbol: "APT",
    image:
      "https://coin-images.coingecko.com/coins/images/26455/large/aptos_round.png?1696525528",
  },
  {
    id: "0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026", // Add Pyth ID later
    name: "TON",
    symbol: "TON",
    image:
      "https://coin-images.coingecko.com/coins/images/17980/large/ton_symbol.png?1696517498",
  },
  {
    id: "0xc415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750", // Add Pyth ID later
    name: "Near Protocol",
    symbol: "NEAR",
    image:
      "https://coin-images.coingecko.com/coins/images/10365/large/near.jpg?1696510367",
  },
  {
    id: "0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5", // Add Pyth ID later
    name: "Arbitrum",
    symbol: "ARB",
    image:
      "https://coin-images.coingecko.com/coins/images/16547/large/arb.jpg?1721358242",
  },
  {
    id: "0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf", // Add Pyth ID later
    name: "Optimism",
    symbol: "OP",
    image:
      "https://coin-images.coingecko.com/coins/images/25244/large/Optimism.png?1696524385",
  },
];
