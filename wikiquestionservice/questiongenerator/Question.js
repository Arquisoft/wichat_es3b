class Question{
    constructor(respuestaCorrecta, preguntas, respuestasIncorrectas, descripcion,img) {
        this.respuestaCorrecta = respuestaCorrecta;
        this.preguntas = preguntas;
        this.respuestasIncorrectas = respuestasIncorrectas;
        this.descripcion = descripcion;
        this.img=img;
    }

    obtenerPreguntaPorIdioma(idioma) {
        return this.preguntas[idioma] || null;
    }
    obtenerRespuestas() {
        return [this.respuestaCorrecta, ...this.respuestasIncorrectas];
    }
    obtenerImg(){
        return this.img;
    }
    toString() {
        const preguntaEs = this.preguntas.es || "Pregunta no disponible en español.";

        const respuestasIncorrectasText = this.respuestasIncorrectas.join(', ');

        let descripcionText = '';
        for (const item of this.descripcion) {
            descripcionText += `${item.propiedad}: ${item.valor}, `;
        }

        return `Para la pregunta: ${preguntaEs}, cuya solución es: ${this.respuestaCorrecta}, y las incorrectas son: ${respuestasIncorrectasText}. Las propiedades de la solución son:${descripcionText}, y la imgagen es: `
            +this.img;
    }
}

module.exports =Question;