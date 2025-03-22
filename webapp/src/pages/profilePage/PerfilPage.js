import { useState } from "react";
import Navbar from "../../components/nav/Nav";
import Sidebar from "../../components/sidebar/Sidebar";
import StatsGraphs from "../../components/stats-graphs/stats-graphs";
import GameHistory from "../../components/game-history/game-history";
import ProfileCard from "../../components/profile-card/profile-card";
import "../../assets/global.css";
import Footer from "../../components/Footer";
import "./PerfilPage.css";

export default function PerfilPage() {
  // Estado para datos de usuario
  const [userData, setUserData] = useState({
    username: "Alejandro Vega",
    level: 4,
    avatar:
      "https://i.pinimg.com/736x/8d/16/90/8d16902ae35c1e982c2990ff85fa11fb.jpg",
    stats: {
      gamesPlayed: 27,
      correctAnswers: 200,
      wrongAnswers: 50,
      ratio: 0.79,
      averageTime: "2s",
      bestScore: 1200,
      bestStreak: 18,
    },
    // Datos para el gráfico de línea
    monthlyData: [
      { month: "Enero", value: 18 },
      { month: "Febrero", value: 26 },
      { month: "Marzo", value: 22 },
      { month: "Abril", value: 35 },
      { month: "Mayo", value: 36 },
    ],
    // Datos para el gráfico circular
    pieData: [
      { name: "Aciertos", value: 79.4 },
      { name: "Fallos", value: 20.6 },
    ],
    // Historial de partidas
    gameHistory: [
      { id: 124, date: "27/02/2024", correct: 16, time: "06:23" },
      { id: 123, date: "27/02/2024", correct: 10, time: "08:25" },
      { id: 122, date: "26/02/2024", correct: 19, time: "05:22" },
      { id: 121, date: "25/02/2024", correct: 14, time: "07:15" },
      { id: 120, date: "24/02/2024", correct: 12, time: "04:45" },
    ],
  });

  // Estado para controlar la visibilidad del menú lateral en móviles
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Estado para controlar el índice actual del carrusel de partidas
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  // Función para alternar la visibilidad del menú lateral
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const closeSideBar = () => setSidebarVisible(false);

  // Función para navegar por el historial de partidas
  const navigateGames = (direction) => {
    if (direction === "prev") {
      setCurrentGameIndex((prev) =>
        prev > 0 ? prev - 1 : userData.gameHistory.length - 1
      );
    } else {
      setCurrentGameIndex((prev) =>
        prev < userData.gameHistory.length - 1 ? prev + 1 : 0
      );
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <div className={`main-content ${sidebarVisible ? "with-sidebar" : ""}`}>
        <div className="sidebar-stats">
          <Sidebar
            userData={userData}
            isVisible={sidebarVisible}
            onClose={closeSideBar}
          ></Sidebar>
        </div>
        <div className="content-area">
          <ProfileCard userData={userData} />
          <StatsGraphs
            monthlyData={userData.monthlyData}
            pieData={userData.pieData}
          />

          {/* Sección de historial de partidas */}
          <GameHistory
            games={userData.gameHistory}
            currentIndex={currentGameIndex}
            onNavigate={navigateGames}
          />
        </div>
      </div>

      <Footer></Footer>
    </div>
  );
}
