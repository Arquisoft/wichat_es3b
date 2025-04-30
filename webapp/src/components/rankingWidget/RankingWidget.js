import React, { useEffect, useState, useCallback } from "react";
import "./RankingWidget.css";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Medal } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RankingWidget = () => {
  const { t, ready } = useTranslation();
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const GATEWAY_URL =
    process.env.REACT_APP_GATEWAY_SERVICE_URL || "http://localhost:8000";

  const fetchRanking = async () => {
    try {
      console.log(`${GATEWAY_URL}/getranking`);
      const response = await axios.get(`${GATEWAY_URL}/getranking`);
      const data = response.data;
      const usersInRanking = data.map((user) => ({
        id: user._id,
        name: user.username,
        profilePic:
          "https://i.pinimg.com/736x/8d/16/90/8d16902ae35c1e982c2990ff85fa11fb.jpg",
        stats: {
          gamesPlayed: user.games,
          correctAnswers: user.rightAnswers,
          wrongAnswers: user.wrongAnswers,
          ratio: parseFloat(user.ratio).toFixed(2),
          averageTime: `${parseFloat(user.averageTime).toFixed(2)} s`,
          bestScore: user.maxScore,
        },
      }));
      setUsers(usersInRanking);
    } catch (error) {
      console.error("Error al obtener el ranking", error);
    }
  };

  useEffect(() => {
    if (ready) fetchRanking();
  }, [ready]);

  const podiumColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

  const getPositionColor = (index) => {
    switch (index) {
      case 0:
        return podiumColors[0];
      case 1:
        return podiumColors[1];
      case 2:
        return podiumColors[2];
      default:
        return "var(--color-primario)";
    }
  };

  const renderMedalIcon = (index) => {
    if (index > 2) return null;
    return (
      <Medal
        className="ml-2"
        size={24}
        color="#000000"
        fill={podiumColors[index]}
      />
    );
  };

  const goToUserProfile = useCallback(
    (userName) => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate(`/stats/${userName}`);
    },
    [navigate]
  );

  const handleKeyDown = useCallback(
    (userName) => (e) => {
      if (e.key === "Enter") {
        goToUserProfile(userName);
      }
    },
    [goToUserProfile]
  );

  if (!ready) return <div>Cargando...</div>;

  return (
    <div className="ranking-container">
      <div className="ranking-header">
        <h1 className="ranking-title">{t("user-ranking")}</h1>
        <p>{t("rankingInfo")}</p>
      </div>

      <div className="ranking-list">
        {users.map((user, index) => {
          return (
            <div
              key={user.id}
              className="ranking-item"
              style={{ animationDelay: `${index * 0.4}s` }}
              onClick={() => goToUserProfile(user.name)}
              onKeyDown={handleKeyDown(user.name)}
              tabIndex={0}
              role="button"
              aria-label={`Ver perfil de ${user.name}`}
            >
              <div
                className="ranking-position"
                style={{ backgroundColor: getPositionColor(index) }}
              >
                {index + 1}
              </div>
              {renderMedalIcon(index)}
              <div className="ranking-user-info">
                <img
                  src={user.profilePic}
                  alt={`Avatar de ${user.name}`}
                  className="ranking-profile-pic"
                />
                <div className="ranking-user-details">
                  <h2 className="ranking-user-name">{user.name}</h2>
                  <div className="ranking-user-stats">
                    <div className="ranking-stat-item">
                      <span className="ranking-stat-label">
                        {t("matches")}:
                      </span>
                      <span className="ranking-stat-value">
                        {user.stats.gamesPlayed}
                      </span>
                    </div>
                    <div className="ranking-stat-item">
                      <span className="ranking-stat-label">
                        {t("correctAnswers")}:
                      </span>
                      <span className="ranking-stat-value">
                        {user.stats.correctAnswers}
                      </span>
                    </div>
                    <div className="ranking-stat-item">
                      <span className="ranking-stat-label">
                        {t("wrongAnswers")}:
                      </span>
                      <span className="ranking-stat-value">
                        {user.stats.wrongAnswers}
                      </span>
                    </div>
                    <div className="ranking-stat-item">
                      <span className="ranking-stat-label">Ratio:</span>
                      <span className="ranking-stat-value">
                        {user.stats.ratio}
                      </span>
                    </div>
                    <div className="ranking-stat-item">
                      <span className="ranking-stat-label">
                        {t("averageTime")}:
                      </span>
                      <span className="ranking-stat-value">
                        {user.stats.averageTime}
                      </span>
                    </div>
                    <div className="ranking-stat-item">
                      <span className="ranking-stat-label">
                        {t("bestScore")}:
                      </span>
                      <span className="ranking-stat-value">
                        {user.stats.bestScore}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RankingWidget;
