class Question {
    constructor(
        respuestaCorrecta,
        preguntas,
        respuestasIncorrectas,
        descripcion,
        img,
        categoryName
    ) {
        this.respuestaCorrecta = respuestaCorrecta;
        this.preguntas = preguntas;
        this.respuestasIncorrectas = respuestasIncorrectas;
        this.descripcion = descripcion;
        this.img = img;
        this.categoryName=categoryName;
    }

    obtenerPreguntaPorIdioma() {
        return this.preguntas;
    }
    obtenerRespuestas() {
        const respuestas = {};
        for (const idioma in this.respuestaCorrecta) {
            if (!this.respuestaCorrecta.hasOwnProperty(idioma)) continue;

            const correcta = this.respuestaCorrecta[idioma] || "Respuesta no disponible";

            const incorrectas = Array.isArray(this.respuestasIncorrectas[idioma])
                ? this.respuestasIncorrectas[idioma]
                : [];

            respuestas[idioma] = [correcta, ...incorrectas];
        }
        const numRespuestas = Object.values(respuestas)[0].length;
        const ordenAleatorio = Array.from({ length: numRespuestas }, (_, i) => i).sort(() => Math.random() - 0.5);

        for (const idioma in respuestas) {
            respuestas[idioma] = ordenAleatorio.map(index => respuestas[idioma][index]);
        }
        return respuestas;
    }
    obtenerImg() {
        return this.img;
    }
    toString() {
        let resultado = "📌 Pregunta Generada:\n";

        for (const idioma in this.preguntas) {
            if (this.preguntas.hasOwnProperty(idioma)) {
                const pregunta = this.preguntas[idioma] || "Pregunta no disponible.";
                const respuestaCorrecta = this.respuestaCorrecta[idioma] || "Respuesta no disponible.";

                const respuestasIncorrectas = this.respuestasIncorrectas[idioma]
                    ? this.respuestasIncorrectas[idioma].join(", ")
                    : "No hay respuestas incorrectas.";

                resultado += `\n🌍 **Idioma:** ${idioma.toUpperCase()}\n`;
                resultado += `❓ Pregunta: ${pregunta}\n`;
                resultado += `✅ Respuesta correcta: ${respuestaCorrecta}\n`;
                resultado += `❌ Respuestas incorrectas: ${respuestasIncorrectas}\n`;
            }
        }

        const descripcionText = this.descripcion.length > 0
            ? this.descripcion.map(item => `${item.propiedad}: ${item.valor}`).join(", ")
            : "No hay descripción disponible.";

        resultado += `\n📝 **Descripción:** ${descripcionText}\n`;

        // Manejar imágenes correctamente
        const imagenesText = this.img.length > 0 ? this.img.join(", ") : "No hay imagen disponible.";
        resultado += `📸 **Imagen:** ${imagenesText}\n`;

        return resultado;
    }
}

module.exports = Question;