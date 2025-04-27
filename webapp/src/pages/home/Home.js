import Nav from "../../components/nav/Nav.js";
import Footer from "../../components/Footer.js";
import BaseButton from '../../components/button/BaseButton.js'
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Home.css";


const isAuthenticated = () => {
  return localStorage.getItem("username") !== null;
};

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleProtectedNavigation = (path) => {
    if (isAuthenticated()) {
      navigate(path);
    } else {
      navigate("/auth");
    }
  };

  const features = [
    {
      title: t("user-ranking"),
      description:
        t("rankingFeature"),
      icon: "🏆",
      buttonText: t("seeRanking"),
      onClick: () => navigate("/ranking"),
    },
    {
      title: t("personalStats"),
      description: t("profileFeature"),
      icon: "📊",
      buttonText: t("seeProfile"),
      onClick: () => handleProtectedNavigation("/profile"),
    },
    {
      title: t("apiForDevelopers"),
      description:
        t("apiKeyFeature"),
      icon: "💻",
      buttonText: t("askForAPIKey"),
      onClick: () => navigate("/apiKeyGenerator"),
    },
  ]

  return (
    <div className="main-container">
      <Nav></Nav>
      <div className="home-container">
        <div className="game-home-section">
          <h1>WIChat</h1>
          <h2>{t("subtitle")}</h2>
          <BaseButton text={t("play")} buttonType="buttonSecondary" onClick={handleProtectedNavigation}></BaseButton>
        </div>
        <div className="features-section">
        {features.map((feature, index) => (
            <div key={index} className="feature-item">
              <div className="feature-content">
                <div className="feature-icon">{feature.icon}</div>
                <h1>{feature.title}</h1>
                <p>{feature.description}</p>
                <BaseButton text={feature.buttonText} onClick={feature.onClick}></BaseButton>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer></Footer>
    </div>
  );
};

export default Home;
