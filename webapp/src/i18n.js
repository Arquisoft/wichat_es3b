import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
    resources: {
        es: {
            translation: {
                "answer": "⏳ Responde en el menor tiempo posible.",
                "confirmPassword": "Confirmar contraseña*",
                "createAccount": "Crear cuenta",
                "email": "Correo electrónico*",
                "footer_text": "© 2025 WIChat. Todos los derechos reservados.",
                "hints": "❓ Usa pistas generadas con IA si lo necesitas.",
                "home": "Inicio",
                "how_to_play": "¿Cómo se juega?",
                "identify": "Identifícate",
                "introduceData": "Introduce tus datos y únete a WiChat ya mismo.",
                "login": "Iniciar sesión",
                "loginMessageInPanel": "“ El conocimiento es un viaje sin final, una aventura que nos enriquece cada dia. Aprender, descubrir y compartir es lo que nos hace crecer, Porque en cada pregunta hay una oportunidad y en cada respuesta, un nuevo reto. Sigamos jugando y ganando juntos! “",
                "loginSuccessful": "Inicio de sesión correcto",
                "logout": "Cerrar sesión",
                "observe": "👁️ Observa la imagen.",
                "or": "o",
                "panel_text": "“ Cada pregunta es un reto, cada acierto un paso más hacia el triunfo.“",
                "password": "Contraseña*",
                "player_score": "Nombre del jugador - Puntuación",
                "play": "Jugar",
                "profile": "Perfil",
                "signup": "Crear cuenta",
                "select_category": "Selecciona una categoría",
                "subtitle": "¡Pon a prueba tus conocimientos con imágenes y pistas interactivas!",
                "title": "WIChat",
                "top_players": "Top 3 jugadores",
                "username": "Nombre de usuario*"
            }
        },
        en: {
            translation: {
                "answer": "⏳ Answer as quickly as possible.",
                "confirmPassword": "Confirm password*",
                "createAccount": "Create account",
                "email": "Email*",
                "footer_text": "© 2025 WIChat. All rights reserved.",
                "hints": "❓ Use AI-generated hints if needed.",
                "home": "Home",
                "how_to_play": "How to play?",
                "identify": "Identify",
                "introduceData": "Enter your data and join WiChat right now.",
                "login": "Login",
                "loginMessageInPanel": "“Knowledge is a never-ending journey, an adventure that enriches us every day. Learning, discovering, and sharing are what make us grow. Because in every question, there is an opportunity, and in every answer, a new challenge. Let's keep playing and winning together!“",
                "loginSuccessful": "Login successful",
                "logout": "Logout",
                "observe": "👁️ Observe the image.",
                "or": "or",
                "panel_text": "“ Each question is a challenge, each correct answer a step closer to victory.“",
                "password": "Password*",
                "player_score": "Player Name - Score",
                "play": "Play",
                "profile": "Profile",
                "signup": "Sign Up",
                "select_category": "Select a category",
                "subtitle": "Test your knowledge with images and interactive clues!",
                "title": "WIChat",
                "top_players": "Top 3 players",
                "username": "Username*"
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
