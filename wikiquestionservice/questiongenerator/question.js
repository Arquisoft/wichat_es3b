class Question {
    constructor(
        respuestaCorrecta,
        preguntas,
        respuestasIncorrectas,
        descripcion,
        img
    ) {
        this.respuestaCorrecta = respuestaCorrecta;
        this.preguntas = preguntas;
        this.respuestasIncorrectas = respuestasIncorrectas;
        this.descripcion = descripcion;
        this.img = img;
    }

    obtenerPreguntaPorIdioma() {
        return this.preguntas;
    }
    obtenerRespuestas() {
        return [this.respuestaCorrecta, ...this.respuestasIncorrectas];
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