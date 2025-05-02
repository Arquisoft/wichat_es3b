import React from "react";
import { useTranslation } from "react-i18next";
import Flag from "react-world-flags"; // Importa react-world-flags
import "./LanguageChangeMenu.css";
import Dropdown from "../dropdown/Dropdown";
import DropdownItem from "../dropdown/dropdownItem/DropdownItem";

const LanguageChangeMenu = ({ variant = "primary" }) => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (selectedLang) => {
    i18n.changeLanguage(selectedLang);
    localStorage.setItem("selectedLanguage", selectedLang);
  };

  const items = [
    { countryCode: "ES", text: "Español", code: "es" }, // España
    { countryCode: "GB", text: "English", code: "en" }, // Reino Unido
  ];

  return (
    <div className="menu">
      <div className="content">
        <Dropdown
          variant={variant}
          buttonText={t("language")}
          content={
            <>
              {items.map((item) => (
                <DropdownItem
                  key={item.code}
                  onClick={() => handleLanguageChange(item.code)}
                >
                  <div className="itemContent">
                    <Flag code={item.countryCode} />
                    {item.text}
                  </div>
                </DropdownItem>
              ))}
            </>
          }
        ></Dropdown>
      </div>
    </div>
  );
};

export default LanguageChangeMenu;
