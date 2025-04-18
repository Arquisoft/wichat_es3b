import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import Game from "../Game"
import { I18nextProvider } from "react-i18next"
import i18n from "../../../i18n"
import '@testing-library/jest-dom'

jest.mock("../../../config", () => ({
  getGatewayUrl: () => "http://localhost:8000"
}))

// Mock de preguntas
const mockQuestions = [
  {
    pregunta: {
      es: "¿Cuál es la capital de Francia?",
      en: "What is the capital of France?"
    },
    respuestaCorrecta: {
      es: "París",
      en: "Paris"
    },
    respuestas: {
      es: ["Londres", "Roma", "Berlín"],
      en: ["London", "Rome", "Berlin"]
    },
    descripcion: "Es una ciudad europea.",
    img: []
  }
]

// Mock de localStorage
beforeEach(() => {
  jest.spyOn(global, "fetch").mockImplementation((url) => {
    if (url.includes("/questionsDB")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockQuestions)
      })
    }

    if (url.includes("/savestats")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "saved" })
      })
    }

    return Promise.reject(new Error("Not Found"))
  })

  Storage.prototype.getItem = jest.fn((key) => {
    if (key === "username") return "testUser"
    if (key === "quizConfig") {
      return JSON.stringify({
        numPreguntas: 1,
        tiempoPregunta: 10,
        limitePistas: 2,
        modoJuego: "Jugador vs IA",
        categories: ["all"]
      })
    }
    return null
  })

  Storage.prototype.setItem = jest.fn()
})

afterEach(() => {
  jest.restoreAllMocks()
})

test("muestra una pregunta y permite seleccionar la respuesta correcta", async () => {
  render(
      <I18nextProvider i18n={i18n}>
        <Game />
      </I18nextProvider>
  )

  // Espera a que cargue la pregunta
  const questionText = await screen.findByText("¿Cuál es la capital de Francia?")
  expect(questionText).toBeInTheDocument()

  // Espera a que se rendericen los botones de respuesta
  const correctOption = await screen.findByRole("button", { name: /París/i })
  expect(correctOption).toBeInTheDocument()

  // Simula el clic en la opción correcta
  fireEvent.click(correctOption)

  // Espera a que cambie el estado de la respuesta seleccionada
  await waitFor(() => {
    expect(correctOption).toHaveClass("buttonCorrect")
  })
})
