class Question{
    constructor(respuestaCorrecta, preguntas, respuestasIncorrectas, descripcion) {
        this.respuestaCorrecta = respuestaCorrecta;
        this.preguntas = preguntas;
        this.respuestasIncorrectas = respuestasIncorrectas;
        this.descripcion = descripcion;
    }

    obtenerPreguntaPorIdioma(idioma) {
        return this.preguntas[idioma] || null;
    }
    obtenerRespuestas() {
        return [this.respuestaCorrecta, ...this.respuestasIncorrectas];
    }
    toString() {
        const preguntaEs = this.preguntas.es || "Pregunta no disponible en español.";

        const respuestasIncorrectasText = this.respuestasIncorrectas.join(', ');

        let descripcionText = '';
        for (const item of this.descripcion) {
            descripcionText += `${item.propiedad}: ${item.valor}\n`;
        }

        return `Para la pregunta: ${preguntaEs}, cuya solución es: ${this.respuestaCorrecta}, y las incorrectas son: ${respuestasIncorrectasText}. Las propiedades de la solución son:\n${descripcionText}`;
    }
}