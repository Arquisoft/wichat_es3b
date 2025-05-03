import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom"; // Importa el Router
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./i18n";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n"; // Asegúrate de importar la instancia

ReactDOM.render(
  <I18nextProvider i18n={i18n}>
    <Router>
      <App />
    </Router>
  </I18nextProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
