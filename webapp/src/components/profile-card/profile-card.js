import "./profile-card.css"

// Componente para mostrar la tarjeta de perfil del usuario
export default function ProfileCard({ userData }) {
  return (
    <section className="profile-card">
      <div className="profile-image">
        <img src={userData.avatar || "/placeholder.svg"} alt={`Foto de perfil de ${userData.username}`} />
      </div>

      <div className="profile-info">
        <div className="profile-header">
          <h2>{userData.username}</h2>
          <div className="profile-level">Nivel {userData.level}</div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${userData.level * 20}%` }}></div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <div className="stat-icon flag-icon"></div>
            <div className="stat-content">
              <div className="stat-value">{userData.stats.gamesPlayed}</div>
              <div className="stat-label">Partidas</div>
            </div>
          </div>

          <div className="profile-stat">
            <div className="stat-icon clock-icon"></div>
            <div className="stat-content">
              <div className="stat-value">{userData.stats.averageTime}</div>
              <div className="stat-label">Respuesta Media</div>
            </div>
          </div>

          <div className="profile-stat">
            <div className="stat-icon check-icon"></div>
            <div className="stat-content">
              <div className="stat-value">{userData.stats.correctAnswers}</div>
              <div className="stat-label">Preguntas acertadas</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

