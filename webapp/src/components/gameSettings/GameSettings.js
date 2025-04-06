import { React, useState, useMemo, useEffect } from "react";
import "./GameSettings.css";
import BaseButton from "../button/BaseButton";
import { useTranslation } from "react-i18next";
import CategoryCard from "../categoryCard/CategoryCard";
import SidebarToggleButton from "../sidebarToggleButton/SidebarToggleButton";
import GameSettingsSidebar from "../gameSettingsSidebar/GameSettingsSidebar";
import { motion } from "framer-motion";

import footballCategory from "../../assets/img/categories/footballCategory.jpg";
import cinemaCategory from "../../assets/img/categories/cinemaCategory.jpg";
import literatureCategory from "../../assets/img/categories/literatureCategory.jpg";
import countriesCategory from "../../assets/img/categories/countriesCategory.jpg";
import artCategory from "../../assets/img/categories/artCategory.jpg";
import allCategory from "../../assets/img/categories/allCategory.jpg";

const GameSettings = ({onStartGame}) => {
  const { t } = useTranslation();
  const categories = useMemo(
    () => [
      { id: "football", name: t("football"), imageSrc: footballCategory, value: "clubes" },
      { id: "cinema", name: t("cinema"), imageSrc: cinemaCategory, value: "cine" },
      { id: "literature", name: t("literature"), imageSrc: literatureCategory , value: "literatura"},
      { id: "countries", name: t("countries"), imageSrc: countriesCategory , value: "paises"},
      { id: "art", name: t("art"), imageSrc: artCategory , value: "arte" },
      { id: "all", name: t("all"), imageSrc: allCategory, value: "all" },
    ],
    [t]
  );

  const [selectedCategories, setSelectedCategories] = useState(() => {
    const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
    return storedConfig?.categories || [];
  })

  useEffect(() => {
    const config = JSON.parse(localStorage.getItem("quizConfig")) || {};
    config.categories = selectedCategories;
    localStorage.setItem("quizConfig", JSON.stringify(config));
  }, [selectedCategories]);
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
    if (storedConfig?.categories) {
      setSelectedCategories(storedConfig.categories);
      forceUpdate(prev => prev + 1);
    }
  }, []);

  useEffect(() => {
    const storedConfig = JSON.parse(localStorage.getItem("quizConfig"));
    if (storedConfig?.categories) {
      setSelectedCategories(storedConfig.categories);
    }
  }, []);

  const toggleCategory = (categoryValue) => {
    setSelectedCategories((prevCategories) => {
      if (categoryValue === "all") {
        return prevCategories.includes("all") ? prevCategories : ["all"];
      }

      let newCategories = prevCategories.includes(categoryValue)
        ? prevCategories.filter((id) => id !== categoryValue)
        : [...prevCategories.filter((id) => id !== "all"), categoryValue];

      // Si se deselecciona la última categoría, evitarlo
      if (newCategories.length === 0) {
        return ["all"];
      }

      return newCategories;
    });
  };

  useEffect(() => {
    const config = JSON.parse(localStorage.getItem("quizConfig")) || {};
    config.categories = selectedCategories;
    localStorage.setItem("quizConfig", JSON.stringify(config));
  }, [selectedCategories]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Animación para los elementos del grid
  const gridAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <div className="mainSettingsPageContainer">
      <div className="gameSettingsContentWrapper">
        <GameSettingsSidebar
          isOpen={sidebarOpen}
          toggleButton={<SidebarToggleButton onClick={toggleSidebar} />}
        />
        <div
          className={`mainGameSettingsContainer ${sidebarOpen ? "gameSidebar-open" : ""}`}
        >
          {!sidebarOpen && (
            <div className="content-toggle-container">
              <SidebarToggleButton onClick={toggleSidebar} />
            </div>
          )}
          <div className="gameCategoriesPanel">
            <h1>{t("select_category")}</h1>
            <motion.div
              className="gameCategoriesGrid"
              initial="hidden"
              animate="visible"
              variants={gridAnimation}
            >
              {categories.map((category) => (
                <motion.div key={category.id} variants={cardAnimation}>
                  <CategoryCard
                    name={category.name}
                    imageSrc={category.imageSrc}
                    isSelected={selectedCategories.includes(category.value)}
                    onClick={() => toggleCategory(category.value)}
                  />
                </motion.div>
              ))}
            </motion.div>

            <div className="gameButtonPanel">
              <BaseButton text={t("play")}
                          onClick={onStartGame}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSettings;
