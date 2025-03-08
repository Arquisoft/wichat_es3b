import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
    resources: {
        es: {
            translation: {
                "title": "WIChat",
                "subtitle": "¡Pon a prueba tus conocimientos con imágenes y pistas interactivas!",
                "play": "Jugar",
                "how_to_play": "¿Cómo se juega?",
                "observe": "👁️ Observa la imagen.",
                "answer": "⏳ Responde en el menor tiempo posible.",
                "hints": "❓ Usa pistas generadas con IA si lo necesitas.",
                "top_players": "Top 3 jugadores",
                "player_score": "Nombre del jugador - Puntuación",
                "home": "Inicio",
                "profile": "Perfil",
                "login": "Iniciar sesión",
                "signup": "Crear cuenta",
                "footer_text": "© 2025 WIChat. Todos los derechos reservados."
            }
        },
        en: {
            translation: {
                "title": "WIChat",
                "subtitle": "Test your knowledge with images and interactive clues!",
                "play": "Play",
                "how_to_play": "How to play?",
                "observe": "👁️ Observe the image.",
                "answer": "⏳ Answer as quickly as possible.",
                "hints": "❓ Use AI-generated hints if needed.",
                "top_players": "Top 3 players",
                "player_score": "Player Name - Score",
                "home": "Home",
                "profile": "Profile",
                "login": "Login",
                "signup": "Sign Up",
                "footer_text": "© 2025 WIChat. All rights reserved."
            }
        }
    },
    lng: "es", // Idioma por defecto
    fallbackLng: "es",
    interpolation: {
        escapeValue: false
    }
});

export default i18n;
