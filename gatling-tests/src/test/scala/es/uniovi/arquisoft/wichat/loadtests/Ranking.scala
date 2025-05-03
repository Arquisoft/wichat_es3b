package es.uniovi.arquisoft.wichat.loadtests

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class Ranking extends Simulation {

  private val httpProtocol = http
    .baseUrl("http://localhost:8000")
    .inferHtmlResources()
    .acceptHeader("application/json, text/plain, */*")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0")
  
  private val headers_0 = Map(
  		"Accept" -> "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  		"If-None-Match" -> """"c6e28276a450aa3cc3304adb76859bb173f5f4f7"""",
  		"Priority" -> "u=0, i",
  		"Upgrade-Insecure-Requests" -> "1"
  )
  
  private val headers_1 = Map(
  		"Accept" -> "*/*",
  		"If-None-Match" -> """"a09770fdc1485eb7ef9f7f81d2efc0db2af89a3a""""
  )
  
  private val headers_2 = Map(
  		"Accept" -> "text/css,*/*;q=0.1",
  		"If-None-Match" -> """"5df8c96bebc6b6e3be913ab40a53a46c47154111"""",
  		"Priority" -> "u=2"
  )
  
  private val headers_3 = Map(
  		"If-None-Match" -> """W/"67a-vWrz7MlaGF6Ql3z1zfDUaumtDWg"""",
  		"Origin" -> "http://localhost:3000"
  )
  
  private val headers_4 = Map(
  		"If-None-Match" -> """W/"83-ozorB1LAMrrs/aBTcRQfS7m3Wvo"""",
  		"Origin" -> "http://localhost:3000"
  )
  
  private val headers_5 = Map(
  		"If-None-Match" -> """W/"391-dPdh7jugDHIOhZVbWzDPG47f1os"""",
  		"Origin" -> "http://localhost:3000"
  )
  
  private val headers_6 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"If-None-Match" -> """"09396b2e808bc818747313d3663b2354992e08fd"""",
  		"Priority" -> "u=4, i"
  )
  
  private val headers_7 = Map(
  		"If-None-Match" -> """W/"aa-pswBDr2FUxdMV0eOp2ok4HkRCd4"""",
  		"Origin" -> "http://localhost:3000"
  )
  
  private val headers_8 = Map(
  		"If-None-Match" -> """W/"688-8es7Q0epz37VDXixxs/ExQ+fusQ"""",
  		"Origin" -> "http://localhost:3000"
  )
  
  private val headers_9 = Map("Origin" -> "http://localhost:3000")
  
  private val uri1 = "localhost"

  private val scn = scenario("Ranking")
    .exec(
      http("request_0")
        .get("http://" + uri1 + ":3000/")
        .headers(headers_0)
        .resources(
          http("request_1")
            .get("http://" + uri1 + ":3000/static/js/main.79f675a0.js")
            .headers(headers_1),
          http("request_2")
            .get("http://" + uri1 + ":3000/static/css/main.5b88c8ca.css")
            .headers(headers_2)
        ),
      pause(1),
      http("request_3")
        .get("/getranking")
        .headers(headers_3),
      pause(5),
      http("request_4")
        .get("/getstats/prueba4")
        .headers(headers_4)
        .resources(
          http("request_5")
            .get("/games/prueba4")
            .headers(headers_5),
          http("request_6")
            .get("http://" + uri1 + ":3000/static/media/librosHistorial.3c9c0778d4f8b079ea0e.jpg")
            .headers(headers_6),
          http("request_7")
            .get("/ratios-per-month/prueba4")
            .headers(headers_7)
        ),
      pause(4),
      http("request_8")
        .get("/getranking")
        .headers(headers_8),
      pause(2),
      http("request_9")
        .get("/getstats/Tontl")
        .headers(headers_9)
        .resources(
          http("request_10")
            .get("/games/Tontl")
            .headers(headers_9),
          http("request_11")
            .get("/ratios-per-month/Tontl")
            .headers(headers_9)
        ),
      pause(4),
      http("request_12")
        .get("/getranking")
        .headers(headers_8)
    )

	setUp(scn.inject(constantUsersPerSec(5).during(15))).protocols(httpProtocol)
}
