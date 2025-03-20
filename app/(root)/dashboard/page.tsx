import TopCoins from '@/components/dash/TopCoins'
import MarketCapWidget from '@/components/dash/market-cap-widgit';
import Trending from '@/components/shared/Trending';
import React from 'react'
import SearchCoin from "@/components/shared/SearchCoin"
import LatestArticle from '@/components/shared/LatestArticle';
import PriceDisplay from '@/components/shared/PriceDisplay';

const Dash = () => {
  return (
    <div className="mb-8">
      <SearchCoin />
      <PriceDisplay />
      <Trending />
      <MarketCapWidget />
      <LatestArticle />
      <TopCoins />
    </div>
  );
}

export default Dash
