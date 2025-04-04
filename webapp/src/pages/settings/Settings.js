import { React, useState, useMemo, useEffect } from "react";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import "./Settings.css";
import BaseButton from "../../components/button/BaseButton";
import { useTranslation } from "react-i18next";
import CategoryCard from "../../components/categoryCard/CategoryCard";
import SidebarToggleButton from "../../components/sidebarToggleButton/SidebarToggleButton";
import GameSettingsSidebar from "../../components/gameSettingsSidebar/GameSettingsSidebar";
import { motion } from "framer-motion";

import footballCategory from "../../assets/img/categories/footballCategory.jpg";
import cinemaCategory from "../../assets/img/categories/cinemaCategory.jpg";
import literatureCategory from "../../assets/img/categories/literatureCategory.jpg";
import countriesCategory from "../../assets/img/categories/countriesCategory.jpg";
import artCategory from "../../assets/img/categories/artCategory.jpg";
import allCategory from "../../assets/img/categories/allCategory.jpg";

const Settings = () => {
  const { t } = useTranslation();
  const categories = useMemo(
    () => [
      { id: "football", name: t("football"), imageSrc: footballCategory },
      { id: "cinema", name: t("cinema"), imageSrc: cinemaCategory },
      { id: "literature", name: t("literature"), imageSrc: literatureCategory },
      { id: "countries", name: t("countries"), imageSrc: countriesCategory },
      { id: "art", name: t("art"), imageSrc: artCategory },
      { id: "all", name: t("all"), imageSrc: allCategory },
    ],
    [t]
  );

  const [selectedCategories, setSelectedCategories] = useState(["all"]);

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prevCategories) => {
      if (categoryId === "all") {
        return prevCategories.includes("all") ? prevCategories : ["all"];
      }

      let newCategories = prevCategories.includes(categoryId)
        ? prevCategories.filter((id) => id !== categoryId)
        : [...prevCategories.filter((id) => id !== "all"), categoryId];

      // Si se deselecciona la última categoría, evitarlo
      if (newCategories.length === 0) {
        return ["all"];
      }

      return newCategories;
    });
  };

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
      <Nav />
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
                    isSelected={selectedCategories.includes(category.id)}
                    onClick={() => toggleCategory(category.id)}
                  />
                </motion.div>
              ))}
            </motion.div>

            <div className="gameButtonPanel">
              <BaseButton text={t("play")} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;
