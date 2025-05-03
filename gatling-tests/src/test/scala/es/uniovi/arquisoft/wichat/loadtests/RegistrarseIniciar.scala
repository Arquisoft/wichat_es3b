package es.uniovi.arquisoft.wichat.loadtests

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class RegistrarseIniciar extends Simulation {

  private val httpProtocol = http
    .baseUrl("http://localhost:8000")
    .inferHtmlResources()
    .acceptHeader("*/*")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0")
  
  private val headers_0 = Map(
  		"Accept" -> "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  		"If-None-Match" -> """"1d88ab0106d37470d7c5e869385e49a8cb8b6971"""",
  		"Priority" -> "u=0, i",
  		"Upgrade-Insecure-Requests" -> "1"
  )
  
  private val headers_1 = Map("If-None-Match" -> """"96aba9cbb4dcc1684988545f1aa3ff46af188e41"""")
  
  private val headers_2 = Map(
  		"Accept" -> "text/css,*/*;q=0.1",
  		"If-None-Match" -> """"07823ad88d76ffd4671c410318e1ce7a934091a3"""",
  		"Priority" -> "u=2"
  )
  
  private val headers_3 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"If-None-Match" -> """"a5197f4dd9fe05e2c6f1e336c159cb55162f4155"""",
  		"Priority" -> "u=0, i"
  )
  
  private val headers_4 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"If-None-Match" -> """"05d3dd3193240d71fb58d735b8366707fd764aa8"""",
  		"Priority" -> "u=4, i"
  )
  
  private val headers_5 = Map(
  		"Access-Control-Request-Headers" -> "content-type",
  		"Access-Control-Request-Method" -> "POST",
  		"Origin" -> "http://localhost:3000",
  		"Priority" -> "u=4"
  )
  
  private val headers_6 = Map(
  		"Accept" -> "application/json, text/plain, */*",
  		"Content-Type" -> "application/json",
  		"Origin" -> "http://localhost:3000",
  		"Priority" -> "u=0"
  )
  
  private val uri1 = "localhost"

  private val scn = scenario("RegistrarseIniciar")
    .exec(
      http("request_0")
        .get("http://" + uri1 + ":3000/")
        .headers(headers_0)
        .resources(
          http("request_1")
            .get("http://" + uri1 + ":3000/static/js/main.071bb8b8.js")
            .headers(headers_1),
          http("request_2")
            .get("http://" + uri1 + ":3000/static/css/main.9aa25afb.css")
            .headers(headers_2)
        ),
      pause(1),
      http("request_3")
        .get("http://" + uri1 + ":3000/static/media/logo_base.07441a09d512a8dec4a4.png")
        .headers(headers_3)
        .resources(
          http("request_4")
            .get("http://" + uri1 + ":3000/static/media/plat%C3%B3.37680582c3eef115c98e.jpg")
            .headers(headers_4)
        ),
      pause(17),
      http("request_5")
        .options("/adduser")
        .headers(headers_5)
        .resources(
          http("request_6")
            .post("/adduser")
            .headers(headers_6)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/registrarseiniciar/0006_request.json"))
        ),
      pause(4),
      http("request_7")
        .options("/login")
        .headers(headers_5)
        .resources(
          http("request_8")
            .post("/login")
            .headers(headers_6)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/registrarseiniciar/0008_request.json"))
        )
    )

	setUp(scn.inject(atOnceUsers(1))).protocols(httpProtocol)
}
