package es.uniovi.arquisoft.wichat.loadtests

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
import java.util.UUID             // Para generar usuarios únicos

class WichatSimulation extends Simulation {

  // 1. Configuración HTTP
  // Define el protocolo base para las peticiones HTTP
  val httpProtocol = http
    .baseUrl("http://localhost:8000") // URL base del servicio gateway
    .acceptHeader("application/json") // Acepta respuestas JSON
    .contentTypeHeader("application/json") // Envía el cuerpo de las peticiones como JSON
    .doNotTrackHeader("1") // Añade cabecera DNT (Do Not Track)
    .acceptLanguageHeader("es-ES,es;q=0.5") // Cabecera de idioma preferido
    .acceptEncodingHeader("gzip, deflate") // Acepta compresión gzip/deflate
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0") // Simula un navegador

  // 2. Datos dinámicos para usuarios
  // Crea un "Feeder" infinito que genera un mapa con username y password únicos en cada iteración
  val userFeeder = Iterator.continually(Map(
    "username" -> ( "user_" + UUID.randomUUID().toString.substring(0, 8) ), // Username aleatorio
    "password" -> ( "pass_" + UUID.randomUUID().toString.substring(0, 8) )  // Password aleatoria
  ))

  // 3. Definición del escenario de usuario virtual
  val scn = scenario("Simulación básica de WiChat") // Nombre del escenario
    .feed(userFeeder) // Cada usuario virtual tomará datos únicos del feeder (username/password)
    .exec(
      // Primera acción: Registrar el usuario
      http("1. Registrar Usuario") // Nombre de la petición (aparecerá en los informes)
        .post("/adduser") // Petición POST al endpoint /adduser
        .body(StringBody("""{ "username": "${username}", "password": "${password}" }""")).asJson // Cuerpo JSON usando los datos del feeder
        .check(status.is(200)) // Verifica que el código de estado HTTP sea 200 (OK)
    )
    .pause(1.second) // Espera 1 segundo (simula tiempo de pensamiento)
    .exec(
      // Segunda acción: Iniciar sesión con el usuario recién registrado
      http("2. Iniciar Sesión")
        .post("/login")
        .body(StringBody("""{ "username": "${username}", "password": "${password}" }""")).asJson
        .check(status.is(200))
        // Extrae valores de la respuesta JSON y los guarda en la sesión del usuario virtual
        .check(jsonPath("$.token").saveAs("authToken")) // Guarda el token de autenticación (si existe)
        .check(jsonPath("$.username").saveAs("loggedInUser")) // Guarda el nombre de usuario logueado
    )
    .pause(1.second) // Espera 1 segundo
    .exec(
      // Tercera acción: Obtener preguntas (requiere estar logueado, aunque no usemos el token en este ejemplo)
      http("3. Obtener Preguntas (Autenticado)")
        .get("/questions?n=5&topic=all") // Petición GET para 5 preguntas de cualquier tema
        // Si la API requiriera autenticación por token:
        // .header("Authorization", "Bearer ${authToken}") // Añadiría la cabecera de autorización
        .check(status.is(200))
        // Verifica la estructura de la respuesta JSON
        .check(jsonPath("$").ofType[Seq[Any]]) // Verifica que la raíz del JSON sea un Array/Secuencia
        .check(jsonPath("$.length()").ofType[Int].is(5)) // <-- Check CORREGIDO: Verifica que la longitud (Int) sea 5
    )
    .pause(1.second) // Espera 1 segundo
    .exec(
      // Cuarta acción: Obtener estadísticas del usuario logueado
      http("4. Obtener Estadísticas (Usuario Logueado)")
        .get("/getstats/${loggedInUser}") // Petición GET usando el username guardado en la sesión
        .check(status.is(200))
        .check(jsonPath("$.username").is("${loggedInUser}")) // Verifica que el username en la respuesta coincida
    )

  setUp(scn.inject(constantUsersPerSec(5).during(15))).protocols(httpProtocol)
}
