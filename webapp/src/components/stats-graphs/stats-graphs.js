"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import "./stats-graphs.css";
import { useTranslation } from "react-i18next";

// Registramos los componentes necesarios de Chart.js
Chart.register(...registerables);

export default function StatsGraphs({ monthlyData, pieData }) {
  const {t} = useTranslation();
  // Referencias para los canvas de los gráficos
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);

  // Colores armoniosos para los gráficos
  const colors = {
    primary: "#36A2EB", // Azul principal
    secondary: "#FF9F40", // Naranja para contraste
    tertiary: "#4BC0C0", // Turquesa para línea
    background: "#f5f9ff", // Fondo claro
    error: "#FF6384", // Rojo para fallos
    success: "#4CAF50", // Verde para aciertos
  };

  useEffect(() => {
    // Creamos el gráfico de línea cuando el componente se monta
    if (lineChartRef.current) {
      const lineCtx = lineChartRef.current.getContext("2d");

      if (lineCtx) {
        // Destruimos cualquier gráfico existente
        const existingChart = Chart.getChart(lineChartRef.current);
        if (existingChart) {
          existingChart.destroy();
        }

        // Creamos el nuevo gráfico de línea
        new Chart(lineCtx, {
          type: "line",
          data: {
            labels: monthlyData.map((item) => item.month),
            datasets: [
              {
                label: t("rightAnswersRatio"),
                data: monthlyData.map((item) => item.value),
                borderColor: colors.tertiary,
                backgroundColor: colors.tertiary + "20",
                tension: 0.3,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: "#e0e0e0",
                },
              },
              x: {
                grid: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: "#333",
                titleColor: "#fff",
                bodyColor: "#fff",
                displayColors: false,
              },
            },
          },
        });
      }
    }

    // Creamos el gráfico circular cuando el componente se monta
    if (pieChartRef.current) {
      const pieCtx = pieChartRef.current.getContext("2d");

      if (pieCtx) {
        // Destruimos cualquier gráfico existente
        const existingChart = Chart.getChart(pieChartRef.current);
        if (existingChart) {
          existingChart.destroy();
        }

        // Creamos el nuevo gráfico circular
        new Chart(pieCtx, {
          type: "pie",
          data: {
            labels: pieData.map((item) => item.name),
            datasets: [
              {
                data: pieData.map((item) => item.value),
                backgroundColor: [colors.success, colors.error],
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  usePointStyle: true,
                  padding: 20,
                },
              },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.label}: ${context.raw}%`,
                },
              },
            },
          },
        });
      }
    }

    // Limpiamos los gráficos cuando el componente se desmonta
    return () => {
      if (lineChartRef.current) {
        const chart = Chart.getChart(lineChartRef.current);
        if (chart) {
          chart.destroy();
        }
      }

      if (pieChartRef.current) {
        const chart = Chart.getChart(pieChartRef.current);
        if (chart) {
          chart.destroy();
        }
      }
    };
  }, [monthlyData, pieData]);

  return (
    <section className="stats-section">
      <h2 className="section-title">{t("graphs")}</h2>

      <div className="graphs-container">
        <div className="line-chart-container">
          <canvas ref={lineChartRef}></canvas>
        </div>

        <div className="pie-chart-container">
          <canvas ref={pieChartRef}></canvas>
        </div>
      </div>
    </section>
  );
}
