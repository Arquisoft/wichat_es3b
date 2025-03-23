import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/nav/Nav";
import Sidebar from "../../components/sidebar/Sidebar";
import StatsGraphs from "../../components/stats-graphs/stats-graphs";
import GameHistory from "../../components/game-history/game-history";
import ProfileCard from "../../components/profile-card/profile-card";
import "../../assets/global.css";
import Footer from "../../components/Footer";
import "./PerfilPage.css";
import SidebarToggleButton from "../../components/sidebarToggleButton/SidebarToggleButton";

export default function PerfilPage() {
  const [userData, setUserData] = useState({
    username: "",
    level: 1, // TODO: no está en el servicio de estadísticas
    avatar:
      "https://i.pinimg.com/736x/8d/16/90/8d16902ae35c1e982c2990ff85fa11fb.jpg",
    stats: {
      gamesPlayed: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      ratio: 0,
      averageTime: "0 s",
      bestScore: 0,
      bestStreak: 0,
    },

    monthlyData: [
      { month: "Enero", value: 18 },
      { month: "Febrero", value: 26 },
      { month: "Marzo", value: 22 },
      { month: "Abril", value: 35 },
      { month: "Mayo", value: 36 },
    ], // TODO: no está en el servicio de estadísticas.

    pieData: [],

    gameHistory: [
      // TODO: no está en el servicio de estadísticas
      { id: 124, date: "27/02/2024", correct: 16, time: "06:23" },
      { id: 123, date: "27/02/2024", correct: 10, time: "08:25" },
      { id: 122, date: "26/02/2024", correct: 19, time: "05:22" },
      { id: 121, date: "25/02/2024", correct: 14, time: "07:15" },
      { id: 120, date: "24/02/2024", correct: 12, time: "04:45" },
    ],
  });

  const [sidebarVisible, setSidebarVisible] = useState(true);

  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const closeSideBar = () => setSidebarVisible(false);

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

  const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:8000";

  const loadUserStats = async (username) => {
    try {
      console.log("Cargando estadísticas para el usuario:", username);
      const response = await axios.get(
        `http://localhost:8000/getstats/${username}`
      );
      console.log("Respuesta del servidor:", response.data);

      const stats = response.data;
      const roundedRatio = parseFloat(stats.ratio).toFixed(2);

      setUserData((prevData) => ({
        ...prevData,
        stats: {
          gamesPlayed: stats.games,
          correctAnswers: stats.rightAnswers,
          wrongAnswers: stats.wrongAnswers,
          ratio: roundedRatio,
          averageTime: `${stats.averageTime} s`,
          bestScore: stats.maxScore,
          bestStreak: 0, // TODO: Este dato no está en el servicio de estadísticas
        },
        pieData: [
          { name: "Aciertos", value: roundedRatio * 100 },
          { name: "Fallos", value: (1 - roundedRatio) * 100 },
        ],
      }));
    } catch (error) {
      console.error("Error al cargar las estadísticas: ", error);
    }
  };

  // Cargar el nombre de usuario desde localStorage al montar el componente
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUserData((prevUserData) => ({
        ...prevUserData,
        username: storedUsername,
      }));
    }
  }, []);

  // Cargar estadísticas de usuario
  useEffect(() => {
    loadUserStats(userData.username);
  }, [userData.username]);

  return (
    <div className="app-container">
      <Navbar />
      <div className={`main-content ${sidebarVisible ? "with-sidebar" : ""}`}>
        <SidebarToggleButton onClick={toggleSidebar}></SidebarToggleButton>
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
