package es.uniovi.arquisoft.wichat.loadtests

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class CargarAplicacion extends Simulation {

  private val httpProtocol = http
    .baseUrl("http://localhost:3000")
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


  private val scn = scenario("CargarAplicacion")
    .exec(
      http("request_0")
        .get("/")
        .headers(headers_0)
        .resources(
          http("request_1")
            .get("/static/js/main.071bb8b8.js")
            .headers(headers_1),
          http("request_2")
            .get("/static/css/main.9aa25afb.css")
            .headers(headers_2)
        )
    )

	setUp(scn.inject(atOnceUsers(1))).protocols(httpProtocol)
}
