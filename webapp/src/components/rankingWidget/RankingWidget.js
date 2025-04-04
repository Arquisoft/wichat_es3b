import React from 'react';
import './RankingWidget.css';
import { useTranslation } from "react-i18next";

const RankingWidget = () => {
    const {t} = useTranslation();

    const users = Array.from({ length: 10 }, (_, index) => ({
        id: index + 1,
        name: `Usuario ${index + 1}`,
        profilePic: "https://i.pinimg.com/736x/8d/16/90/8d16902ae35c1e982c2990ff85fa11fb.jpg",
        stats: {
          gamesPlayed: Math.floor(Math.random() * 100),
          correctAnswers: Math.floor(Math.random() * 80),
          wrongAnswers: Math.floor(Math.random() * 20),
          ratio: (Math.random() * 100).toFixed(2),
          averageTime: `${(Math.random() * 10).toFixed(1)} s`,
          bestScore: Math.floor(Math.random() * 1000),
        },
      }));



  return (
    <div className='ranking-container'>
        <h1 className='ranking-title'>{t('user-ranking')}</h1>
        <div className='ranking-list'>
            {users.map((user, index) => (
                <div className='ranking-item'>
                    <div className='ranking-position'>{index + 1}</div>
                    <div className='ranking-user-info'>
                        <img src={user.profilePic} alt='Avatar' className='ranking-profile-pic'/>
                        <div className='ranking-user-details'>
                            <h2 className='ranking-user-name'>{user.name}</h2>
                            <div className='ranking-user-stats'>
                                <div className='ranking-stat-item'>
                                    <span className='ranking-stat-label'>{t("matches")}:</span>
                                    <span className='ranking-stat-value'>{user.stats.gamesPlayed}</span>
                                </div>
                                <div className='ranking-stat-item'>
                                    <span className='ranking-stat-label'>{t("correctAnswers")}:</span>
                                    <span className='ranking-stat-value'>{user.stats.correctAnswers}</span>
                                </div>
                                <div className='ranking-stat-item'>
                                    <span className='ranking-stat-label'>{t("wrongAnswers")}:</span>
                                    <span className='ranking-stat-value'>{user.stats.wrongAnswers}</span>
                                </div>
                                <div className='ranking-stat-item'>
                                    <span className='ranking-stat-label'>Ratio:</span>
                                    <span className='ranking-stat-value'>{user.stats.ratio}</span>
                                </div>
                                <div className='ranking-stat-item'>
                                    <span className='ranking-stat-label'>{t("averageTime")}:</span>
                                    <span className='ranking-stat-value'>{user.stats.averageTime}</span>
                                </div>
                                <div className='ranking-stat-item'>
                                    <span className='ranking-stat-label'>{t("bestScore")}:</span>
                                    <span className='ranking-stat-value'>{user.stats.bestScore}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  )
}

export default RankingWidget