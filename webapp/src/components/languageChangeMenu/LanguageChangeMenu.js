import React from "react";
import { useTranslation } from "react-i18next";
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
    { countryCode: "ES", text: "Español (ES)", code: "es" },
    { countryCode: "GB", text: "English (EN)", code: "en" },
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
