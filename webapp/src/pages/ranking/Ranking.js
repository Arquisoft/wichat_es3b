import React from 'react';
import Nav from '../../components/nav/Nav';
import Footer from '../../components/Footer';
import RankingWidget from '../../components/rankingWidget/RankingWidget';
import './Ranking.css';

const Ranking = () => {
  return (
    <div className='main-rankingPage-container'>
        <Nav></Nav>
        <main className='ranking-contentWrapper'>
            <RankingWidget></RankingWidget>
        </main>
        <Footer></Footer>
    </div>
  )
}

export default Ranking;