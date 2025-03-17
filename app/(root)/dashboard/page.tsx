import TopCoins from '@/components/dash/TopCoins'
import MarketCapWidget from '@/components/dash/market-cap-widgit';
import Trending from '@/components/shared/Trending';
import React from 'react'
import SearchCoin from "@/components/shared/SearchCoin"
import LatestArticle from '@/components/shared/LatestArticle';

const Dash = () => {
  return (
    <div className='mb-8'>
      <SearchCoin/>
      <MarketCapWidget/>
      <LatestArticle/>
      <Trending  />
      <TopCoins  />
    </div>
  );
}

export default Dash
