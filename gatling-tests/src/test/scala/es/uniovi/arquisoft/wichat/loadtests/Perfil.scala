package es.uniovi.arquisoft.wichat.loadtests

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class Perfil extends Simulation {

  private val httpProtocol = http
    .baseUrl("http://localhost:8000")
    .inferHtmlResources()
    .acceptHeader("application/json, text/plain, */*")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3")
    .originHeader("http://localhost:3000")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0")
  


  private val scn = scenario("Perfil")
    .exec(
      http("request_0")
        .get("/getstats/charge")
        .check(status.is(404))
        .resources(
          http("request_1")
            .get("/ratios-per-month/charge"),
          http("request_2")
            .get("/games/charge")
        )
    )

	setUp(scn.inject(atOnceUsers(1))).protocols(httpProtocol)
}
