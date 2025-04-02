import { React, useState } from "react";
import Nav from "../../components/nav/Nav";
import Footer from "../../components/Footer";
import "./Settings.css";
import BaseButton from "../../components/button/BaseButton";
import { useTranslation } from "react-i18next";
import CategoryCard from "../../components/categoryCard/CategoryCard";

import footballCategory from "../../assets/img/categories/footballCategory.jpg";
import cinemaCategory from "../../assets/img/categories/cinemaCategory.jpg";
import literatureCategory from "../../assets/img/categories/literatureCategory.jpg";
import countriesCategory from '../../assets/img/categories/countriesCategory.jpg';
import artCategory from '../../assets/img/categories/artCategory.jpg';
import allCategory from '../../assets/img/categories/allCategory.jpg';

const Settings = () => {
  const { t } = useTranslation();
  const categories = [
    { name: t("football"), imageSrc: footballCategory },
    { name: t("cinema"), imageSrc: cinemaCategory },
    { name: t("literature"), imageSrc: literatureCategory },
    { name: t("countries"), imageSrc: countriesCategory },
    { name: t("art"), imageSrc: artCategory },
    { name: t("all"), imageSrc: allCategory },
  ];
  const [selectedCategory, setSelectedCategory] = useState(categories[categories.length-1].name);

  return (
    <div className="mainSettingsPageContainer">
      <Nav />
      <main className="mainGameSettingsContainer">
        <h1>{t("select_category")}</h1>
        <div className="gameCategoriesGrid">
          {categories.map((category, index) => (
            <CategoryCard
              key={index}
              name={category.name}
              imageSrc={category.imageSrc}
              isSelected={selectedCategory === category.name}
              onClick={() => setSelectedCategory(category.name)}
            ></CategoryCard>
          ))}
        </div>
        <div className="gameButtonPanel">
          <BaseButton text={t("play")}></BaseButton>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
