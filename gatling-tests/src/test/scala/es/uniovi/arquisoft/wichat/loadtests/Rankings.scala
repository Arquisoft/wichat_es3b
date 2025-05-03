package es.uniovi.arquisoft.wichat.loadtests

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class Rankings extends Simulation {

  private val httpProtocol = http
    .baseUrl("http://localhost:8000")
    .inferHtmlResources()
    .acceptHeader("application/json, text/plain, */*")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0")
  
  private val headers_0 = Map(
  		"If-None-Match" -> """W/"67a-vWrz7MlaGF6Ql3z1zfDUaumtDWg"""",
  		"Origin" -> "http://localhost:3000"
  )
  
  private val headers_1 = Map("Origin" -> "http://localhost:3000")
  
  private val headers_3 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"Priority" -> "u=4, i"
  )
  
  private val uri1 = "localhost"

  private val scn = scenario("Rankings")
    .exec(
      http("request_0")
        .get("/getranking")
        .headers(headers_0),
      pause(2),
      http("request_1")
        .get("/getstats/prueba4")
        .headers(headers_1)
        .resources(
          http("request_2")
            .get("/games/prueba4")
            .headers(headers_1),
          http("request_3")
            .get("http://" + uri1 + ":3000/static/media/librosHistorial.3c9c0778d4f8b079ea0e.jpg")
            .headers(headers_3),
          http("request_4")
            .get("/ratios-per-month/prueba4")
            .headers(headers_1)
        ),
      pause(5),
      http("request_5")
        .get("/getranking")
        .headers(headers_0),
      pause(3),
      http("request_6")
        .get("/getstats/pruebaDrus")
        .headers(headers_1)
        .resources(
          http("request_7")
            .get("/games/pruebaDrus")
            .headers(headers_1),
          http("request_8")
            .get("/ratios-per-month/pruebaDrus")
            .headers(headers_1)
        ),
      pause(5),
      http("request_9")
        .get("/getranking")
        .headers(headers_0),
      pause(4),
      http("request_10")
        .get("/getstats/DrusPrueba2")
        .headers(headers_1)
        .resources(
          http("request_11")
            .get("/ratios-per-month/DrusPrueba2")
            .headers(headers_1),
          http("request_12")
            .get("/games/DrusPrueba2")
            .headers(headers_1)
        ),
      pause(4),
      http("request_13")
        .get("/getranking")
        .headers(headers_0)
    )

	setUp(scn.inject(atOnceUsers(1))).protocols(httpProtocol)
}
