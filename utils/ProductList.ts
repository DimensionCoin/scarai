// utils/ProductList.ts
export interface DeFiProduct {
  name: string;
  description: string;
  category: string;
  image?: string; // URL in the format https://x.com/[username]/photo
  xHandle: string; // X handle for reference
}

export const productList: DeFiProduct[] = [
  {
    name: "Aave",
    description:
      "A decentralized lending protocol allowing users to lend and borrow crypto assets with variable or stable interest rates, featuring flash loans.",
    category: "Lending/Borrowing",
    image: "https://x.com/AaveAave/photo",
    xHandle: "AaveAave",
  },
  {
    name: "Compound",
    description:
      "An algorithmic lending protocol on Ethereum where users can supply assets to earn interest or borrow against collateral.",
    category: "Lending/Borrowing",
    image: "https://x.com/compoundfinance/photo",
    xHandle: "compoundfinance",
  },
  {
    name: "Drift",
    description:
      "A decentralized perpetual futures trading platform on Solana, offering leveraged trading with cross-margining.",
    category: "Derivatives",
    image: "https://x.com/DriftProtocol/photo",
    xHandle: "DriftProtocol",
  },
  {
    name: "Marginfi",
    description:
      "A Solana-based lending protocol focused on risk management, enabling users to lend, borrow, and leverage assets.",
    category: "Lending/Borrowing",
    image: "https://x.com/marginfi/photo",
    xHandle: "marginfi",
  },
  {
    name: "Kamino",
    description:
      "A DeFi platform on Solana offering lending, borrowing, and automated liquidity strategies, including leveraged yield farming.",
    category: "Lending/Borrowing",
    image: "https://x.com/KaminoFinance/photo",
    xHandle: "KaminoFinance",
  },
  {
    name: "Uniswap",
    description:
      "A leading decentralized exchange (DEX) on Ethereum for swapping tokens via automated market makers (AMMs).",
    category: "Decentralized Exchange (DEX)",
    image: "https://x.com/Uniswap/photo",
    xHandle: "Uniswap",
  },
  {
    name: "Curve Finance",
    description:
      "A DEX optimized for stablecoin trading with low slippage and high liquidity through AMM pools.",
    category: "Decentralized Exchange (DEX)",
    image: "https://x.com/CurveFinance/photo",
    xHandle: "CurveFinance",
  },
  {
    name: "MakerDAO",
    description:
      "A protocol issuing the DAI stablecoin, allowing users to lock collateral and borrow DAI in a decentralized manner.",
    category: "Lending/Borrowing",
    image: "https://x.com/MakerDAO/photo",
    xHandle: "MakerDAO",
  },
  {
    name: "SushiSwap",
    description:
      "A DEX forked from Uniswap, offering token swaps, liquidity provision, and yield farming opportunities.",
    category: "Decentralized Exchange (DEX)",
    image: "https://x.com/SushiSwap/photo",
    xHandle: "SushiSwap",
  },
  {
    name: "PancakeSwap",
    description:
      "A Binance Smart Chain-based DEX for token swaps, yield farming, and staking with low fees.",
    category: "Decentralized Exchange (DEX)",
    image: "https://x.com/PancakeSwap/photo",
    xHandle: "PancakeSwap",
  },
  {
    name: "dYdX",
    description:
      "A decentralized platform for margin trading and perpetual contracts, originally on Ethereum, now with a Cosmos-based chain.",
    category: "Derivatives",
    image: "https://x.com/dYdX/photo",
    xHandle: "dYdX",
  },
  {
    name: "Lido Finance",
    description:
      "A liquid staking solution for Ethereum and other chains, allowing users to stake assets and receive liquid tokens (e.g., stETH).",
    category: "Liquid Staking",
    image: "https://x.com/LidoFinance/photo",
    xHandle: "LidoFinance",
  },
  {
    name: "Yearn Finance",
    description:
      "A yield aggregator that optimizes returns by automatically shifting funds between lending protocols.",
    category: "Yield Farming",
    image: "https://x.com/yearnfi/photo",
    xHandle: "yearnfi",
  },
  {
    name: "Balancer",
    description:
      "A DEX and liquidity protocol allowing customizable AMM pools with multiple tokens and weights.",
    category: "Decentralized Exchange (DEX)",
    image: "https://x.com/Balancer/photo",
    xHandle: "Balancer",
  },
  {
    name: "Synthetix",
    description:
      "A protocol for creating synthetic assets (Synths) tracking real-world assets, with staking and trading features.",
    category: "Derivatives",
    image: "https://x.com/synthetix_io/photo",
    xHandle: "synthetix_io",
  },
  {
    name: "Raydium",
    description:
      "A Solana-based DEX with AMM and order book features for fast token swaps and liquidity provision.",
    category: "Decentralized Exchange (DEX)",
    image: "https://x.com/RaydiumProtocol/photo",
    xHandle: "RaydiumProtocol",
  },
  {
    name: "Orca",
    description:
      "A user-friendly DEX on Solana for swapping SPL tokens and providing liquidity to incentivized pools.",
    category: "Decentralized Exchange (DEX)",
    image: "https://x.com/orca_so/photo",
    xHandle: "orca_so",
  },
  {
    name: "Solend",
    description:
      "A lending and borrowing protocol on Solana with algorithmic interest rates and a focus on usability.",
    category: "Lending/Borrowing",
    image: "https://x.com/solendprotocol/photo",
    xHandle: "solendprotocol",
  },
  {
    name: "GMX",
    description:
      "A decentralized exchange for perpetual futures trading with up to 50x leverage, available on Arbitrum and Avalanche.",
    category: "Derivatives",
    image: "https://x.com/GMX_IO/photo",
    xHandle: "GMX_IO",
  },
  {
    name: "PoolTogether",
    description:
      "A no-loss savings game where users deposit funds into pools to win prizes, built on lending protocols.",
    category: "Yield Farming",
    image: "https://x.com/PoolTogether_/photo",
    xHandle: "PoolTogether_",
  },
];

export default productList;
