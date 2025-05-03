package es.uniovi.arquisoft.wichat.loadtests

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class Play10qCountries extends Simulation {

  private val httpProtocol = http
    .baseUrl("http://localhost:8000")
    .inferHtmlResources()
    .acceptHeader("image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0")
  
  private val headers_0 = Map("Priority" -> "u=1, i")
  
  private val headers_1 = Map("Priority" -> "u=0, i")
  
  private val headers_6 = Map(
  		"Accept" -> "*/*",
  		"Origin" -> "http://localhost:3000",
  		"Priority" -> "u=4"
  )
  
  private val headers_7 = Map(
  		"Accept" -> "*/*",
  		"Access-Control-Request-Headers" -> "content-type",
  		"Access-Control-Request-Method" -> "POST",
  		"Origin" -> "http://localhost:3000",
  		"Priority" -> "u=4"
  )
  
  private val headers_8 = Map(
  		"Accept" -> "*/*",
  		"Content-Type" -> "application/json",
  		"Origin" -> "http://localhost:3000",
  		"Priority" -> "u=4"
  )
  
  private val uri1 = "localhost"

  private val scn = scenario("Play10qCountries")
    .exec(
      http("request_0")
        .get("http://" + uri1 + ":3000/static/media/cinemaCategory.3700251e39422a873b7f.jpg")
        .headers(headers_0)
        .resources(
          http("request_1")
            .get("http://" + uri1 + ":3000/static/media/footballCategory.cdedf63990a8abc504d4.jpg")
            .headers(headers_1),
          http("request_2")
            .get("http://" + uri1 + ":3000/static/media/literatureCategory.4d4361bdce02922043e6.jpg")
            .headers(headers_0),
          http("request_3")
            .get("http://" + uri1 + ":3000/static/media/allCategory.a021cf13f6e0aefd3390.jpg")
            .headers(headers_0),
          http("request_4")
            .get("http://" + uri1 + ":3000/static/media/countriesCategory.1804b0cc79f35da8f780.jpg")
            .headers(headers_0),
          http("request_5")
            .get("http://" + uri1 + ":3000/static/media/artCategory.7b3a6317b321ff35b188.jpg")
            .headers(headers_0)
        ),
      pause(4),
      http("request_6")
        .get("/questionsDB?n=10&topic=paises")
        .headers(headers_6),
      pause(22),
      http("request_7")
        .options("/savestats")
        .headers(headers_7)
        .resources(
          http("request_8")
            .post("/savestats")
            .headers(headers_8)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/play10qcountries/0008_request.json"))
        )
    )

	setUp(scn.inject(atOnceUsers(1))).protocols(httpProtocol)
}
