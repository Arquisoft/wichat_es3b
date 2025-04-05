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

    monthlyData: [], // TODO: no está en el servicio de estadísticas.

    pieData: [],

    gameHistory: [],
  });

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

  // Estado para controlar la visibilidad del menú lateral en móviles
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
      const response = await axios.get(`${gatewayUrl}/getstats/${username}`);
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
          averageTime: `${parseFloat(stats.averageTime).toFixed(2)} s`,
          bestScore: stats.maxScore,
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

  const loadGameHistory = async (username) => {
    try {
      if (!username) return;
      const response = await axios.get(`${gatewayUrl}/games/${username}`);
      const games = response.data.map((game, index) => ({
        id: index + 1, // TODO: Esto no debería estar hardcodeado
        date: new Date(game.date).toLocaleDateString("es-Es"),
        correct: game.rightAnswers,
        time: `${game.time} s`,
        score: game.score,
        ratio: game.ratio,
      }));
      setUserData((prevData) => ({
        ...prevData,
        gameHistory: games,
      }));
    } catch (error) {
      console.error("Error al cargar el historial de partidas: " + error);
    }
  };

  // Obtiene los últimos 5 meses esperados (incluyendo el actual)
  const getLastFiveMonths = () => {
    const expectedMonths = [];
    const now = new Date();

    for (let i = 4; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(1);
      date.setMonth(now.getMonth() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      expectedMonths.push(`${year}-${month}`);
    }

    return expectedMonths;
  };

  // Obtiene los datos por mes
  const createMonthDataMap = (apiData) => {
    const dataByMonth = {};
    apiData.forEach((item) => {
      dataByMonth[item.month] = item.avgRatio;
    });
    return dataByMonth;
  };

  // Formatea un string de mes (YYYY-MM) a un nombre legible (Ej: "Enero 2023")
  const formatMonthName = (monthKey) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(year, month - 1);
    const monthName = date.toLocaleDateString("es-ES", {
      month: "short",
      year: "numeric",
    });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  // Procesa los datos para el gráfico
  const processChartData = (expectedMonths, monthDataMap) => {
    return expectedMonths.map((monthKey) => ({
      month: formatMonthName(monthKey),
      value: monthDataMap[monthKey]
        ? parseFloat((monthDataMap[monthKey] * 100).toFixed(2))
        : 0, // Si no hay datos para el mes correspondiente, el ratio de ese mes es 0% (no hay partidas registradas)
    }));
  };

  // Función principal que carga las estadísticas mensuales.
  const loadMonthlyStats = async (username) => {
    try {
      if (!username) return;
      const response = await axios.get(
        `${gatewayUrl}/ratios-per-month/${username}`
      );
      const expectedMonths = getLastFiveMonths();
      console.log("Meses esperados:", expectedMonths);
      const monthDataMap = createMonthDataMap(response.data);
      const monthlyStats = processChartData(expectedMonths, monthDataMap);

      setUserData((prevData) => ({
        ...prevData,
        monthlyData: monthlyStats,
      }));
    } catch (error) {
      console.error("Error al cargar estadísticas mensuales: ", error);
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
    loadGameHistory(userData.username);
    loadMonthlyStats(userData.username);
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
          {userData.gameHistory && userData.gameHistory.length > 0 && (
            <GameHistory
              games={userData.gameHistory}
              currentIndex={currentGameIndex}
              onNavigate={navigateGames}
            />
          )}
        </div>
      </div>

      <Footer></Footer>
    </div>
  );
}
