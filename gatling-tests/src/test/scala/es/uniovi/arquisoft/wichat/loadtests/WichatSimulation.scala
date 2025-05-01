package es.uniovi.arquisoft.wichat.loadtests

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
import java.util.UUID
import scala.util.Random // Para simular datos de partida
import java.time.Instant // Para obtener la fecha actual en formato ISO

class WichatSimulation extends Simulation {

  // 1. Configuración HTTP
  val httpProtocol = http
    .baseUrl("http://localhost:8000") // Trabajando en local
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
    .doNotTrackHeader("1")
    .acceptLanguageHeader("es-ES,es;q=0.5")
    .acceptEncodingHeader("gzip, deflate")
    .userAgentHeader("Gatling/PerformanceTest - Mozilla/5.0")
  // Considera añadir timeouts si las peticiones tardan demasiado bajo carga alta
  // .requestTimeout(60.seconds)

  // 2. Datos dinámicos para usuarios
  val userFeeder = Iterator.continually {
    val uniqueId = UUID.randomUUID().toString.substring(0, 8)
    Map(
      "username" -> s"user_$uniqueId",
      "password" -> s"pass_$uniqueId",
      "email"    -> s"user_$uniqueId@example.com"
    )
  }

  // 3. Definición del escenario de usuario virtual
  val scn = scenario("Simulación WiChat: Flujo con QuestionsDB")
    .feed(userFeeder)
    .exec(
      // --- REGISTRO ---
      http("1. Registrar Usuario")
        .post("/adduser")
        .body(StringBody("""{ "email": "${email}", "username": "${username}", "password": "${password}" }""")).asJson
        .check(status.is(200))
    )
    .pause(500.milliseconds, 1.second)
    .exec(
      // --- LOGIN ---
      http("2. Iniciar Sesión")
        .post("/login")
        .body(StringBody("""{ "username": "${username}", "password": "${password}" }""")).asJson
        .check(status.is(200))
        .check(jsonPath("$.token").exists.saveAs("authToken"))
        .check(jsonPath("$.username").is("${username}"))
    )
    .pause(1.second, 2.seconds)
    .exec(
      // --- OBTENER PREGUNTAS DB (Inicio de Partida) ---
      http("3. Obtener Preguntas DB")
        .get("/questionsDB?n=5&topic=all") // Usamos el endpoint correcto
        // --- CORRECCIÓN: Eliminada cabecera Authorization ya que no es necesaria ---
        // .header("Authorization", "Bearer ${authToken}")
        .check(status.is(200)) // Aún esperamos 200 OK, pero fallará si el backend tiene errores 500
        .check(jsonPath("$").ofType[Seq[Any]]) // Esperamos un array
        .check(jsonPath("$.length()").ofType[Int].is(5)) // Verificamos que vienen 5
    )
    // --- SIMULAR TIEMPO DE PARTIDA (Lectura + Respuestas en Frontend) ---
    .pause(20.seconds, 60.seconds) // Simula el tiempo que el usuario interactúa en el frontend

    // --- GUARDAR ESTADÍSTICAS (Fin de Partida) ---
    .exec(
      http("4. Guardar Estadísticas")
        .post("/savestats")
        // Asumimos que guardar stats SÍ requiere autenticación
        .header("Authorization", "Bearer ${authToken}")
        .body(StringBody(session => {
          val rightAnswers = Random.nextInt(6)
          val wrongAnswers = 5 - rightAnswers
          val time = Random.nextInt(41) + 20
          val score = rightAnswers * (Random.nextInt(5) + 8)
          val win = rightAnswers > wrongAnswers
          val currentDate = Instant.now().toString()
          s"""{
             |  "username": "${session("username").as[String]}",
             |  "rightAnswers": $rightAnswers,
             |  "wrongAnswers": $wrongAnswers,
             |  "time": $time,
             |  "score": $score,
             |  "win": $win,
             |  "date": "$currentDate",
             |  "gameMode": "singleplayer"
             |}""".stripMargin
        })).asJson
        .check(status.is(200)) // Se espera 200 OK
    )
    .pause(1.second, 3.seconds)

    // --- CONSULTAS DESPUÉS DE JUGAR ---
    // Asumimos que estas consultas SÍ requieren autenticación
    .exec(
      http("5. Obtener Estadísticas (Después de Jugar)")
        .get("/getstats/${username}")
        .header("Authorization", "Bearer ${authToken}")
        .check(status.is(200))
        .check(jsonPath("$.username").is("${username}"))
        .check(jsonPath("$.games").ofType[Int].is(1))
    )
    .pause(500.milliseconds, 1.second)
    .exec(
      http("6. Obtener Historial Partidas")
        .get("/games/${username}")
        .header("Authorization", "Bearer ${authToken}")
        .check(status.is(200))
        .check(jsonPath("$").ofType[Seq[Any]]) // Verificar que la respuesta es un array JSON
    )
    .pause(500.milliseconds, 1.second)
    .exec(
      http("7. Obtener Ratios Mensuales")
        .get("/ratios-per-month/${username}")
        .header("Authorization", "Bearer ${authToken}")
        .check(status.is(200))
        .check(jsonPath("$").ofType[Seq[Any]]) // Esperamos un array
    )
    .pause(500.milliseconds, 1.second)
    .exec(
      http("8. Obtener Ranking")
        .get("/getranking")
        // El ranking podría ser público o requerir auth, mantenemos el token por si acaso
        .header("Authorization", "Bearer ${authToken}")
        .check(status.is(200))
        .check(jsonPath("$").ofType[Seq[Any]]) // Esperamos un array
    )

  // 4. Configuración de la inyección de carga y Aserciones Globales
  setUp(
    scn.inject(
      rampUsers(50).during(30.seconds) // Perfil de carga ejemplo
    )
  ).protocols(httpProtocol)
    .assertions(
      // Las aserciones sobre tiempo probablemente pasarán, pero la de fallos no mientras /questionsDB falle
      global.responseTime.percentile(95).lt(1000),
      global.responseTime.max.lt(2000),
      global.failedRequests.percent.lt(1) // Objetivo: < 1% de fallos
    )
}
