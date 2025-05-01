import "./profile-card.css";
import { useTranslation } from "react-i18next";
import UserAvatar from "../userAvatar/UserAvatar";

// Componente para mostrar la tarjeta de perfil del usuario
export default function ProfileCard({ userData }) {
  const { t } = useTranslation();

  return (
    <section className="profile-card">
      <div className="profile-image">
        <UserAvatar username={userData.username}></UserAvatar>
      </div>

      <div className="profile-info">
        <div className="profile-header">
          <h2>{userData.username}</h2>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <div className="stat-icon flag-icon"></div>
            <div className="stat-content">
              <div className="stat-value">{userData.stats.gamesPlayed}</div>
              <div className="stat-label">{`${t("matches")}`}</div>
            </div>
          </div>

          <div className="profile-stat">
            <div className="stat-icon clock-icon"></div>
            <div className="stat-content">
              <div className="stat-value">{userData.stats.averageTime}</div>
              <div className="stat-label">{`${t("averageTime")}`}</div>
            </div>
          </div>

          <div className="profile-stat">
            <div className="stat-icon check-icon"></div>
            <div className="stat-content">
              <div className="stat-value">{userData.stats.correctAnswers}</div>
              <div className="stat-label">{`${t("rightQuestions")}`}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
