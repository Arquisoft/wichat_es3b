package es.uniovi.arquisoft.wichat.loadtests

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class PlaySolo extends Simulation {

  private val httpProtocol = http
    .baseUrl("http://localhost:8000")
    .inferHtmlResources()
    .acceptHeader("image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5")
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
  		"If-None-Match" -> """"05d3dd3193240d71fb58d735b8366707fd764aa8"""",
  		"Priority" -> "u=4, i"
  )
  
  private val headers_4 = Map(
  		"If-None-Match" -> """"a5197f4dd9fe05e2c6f1e336c159cb55162f4155"""",
  		"Priority" -> "u=0, i"
  )
  
  private val headers_5 = Map(
  		"Accept" -> "*/*",
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
  
  private val headers_7 = Map(
  		"If-None-Match" -> """"94002aabafcfb7860bc1dbb238b9069060b8c504"""",
  		"Priority" -> "u=0, i"
  )
  
  private val headers_8 = Map(
  		"If-None-Match" -> """"8800fbca00886dc6e65f135750cdefba7ed81b73"""",
  		"Priority" -> "u=0, i"
  )
  
  private val headers_9 = Map(
  		"If-None-Match" -> """"55fb7d086dcae2d5dca6be6160179ffd8ef21f18"""",
  		"Priority" -> "u=0, i"
  )
  
  private val headers_10 = Map(
  		"If-None-Match" -> """"ec21b846aa914221cfb610e8acb180e7dd7b0b81"""",
  		"Priority" -> "u=0, i"
  )
  
  private val headers_11 = Map(
  		"If-None-Match" -> """"357346d3f724fdf59fdd1bd9245acae51e3b0757"""",
  		"Priority" -> "u=0, i"
  )
  
  private val headers_12 = Map(
  		"If-None-Match" -> """"8053ea886fdf2656726dc5b9fefd836779f42919"""",
  		"Priority" -> "u=0, i"
  )
  
  private val headers_13 = Map(
  		"Accept" -> "*/*",
  		"Origin" -> "http://localhost:3000",
  		"Priority" -> "u=4"
  )
  
  private val headers_15 = Map(
  		"Accept" -> "*/*",
  		"Content-Type" -> "application/json",
  		"Origin" -> "http://localhost:3000",
  		"Priority" -> "u=4"
  )
  
  private val headers_16 = Map(
  		"Accept" -> "application/json, text/plain, */*",
  		"Origin" -> "http://localhost:3000"
  )
  
  private val headers_17 = Map(
  		"Accept" -> "application/json, text/plain, */*",
  		"If-None-Match" -> """W/"2-l9Fw4VUO7kr8CvBlt4zaMCqXZ0w"""",
  		"Origin" -> "http://localhost:3000"
  )
  
  private val headers_19 = Map(
  		"If-None-Match" -> """"09396b2e808bc818747313d3663b2354992e08fd"""",
  		"Priority" -> "u=4, i"
  )
  
  private val uri1 = "localhost"

  private val scn = scenario("PlaySolo")
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
        .get("http://" + uri1 + ":3000/static/media/plat%C3%B3.37680582c3eef115c98e.jpg")
        .headers(headers_3)
        .resources(
          http("request_4")
            .get("http://" + uri1 + ":3000/static/media/logo_base.07441a09d512a8dec4a4.png")
            .headers(headers_4)
        ),
      pause(5),
      http("request_5")
        .options("/login")
        .headers(headers_5)
        .resources(
          http("request_6")
            .post("/login")
            .headers(headers_6)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playsolo/0006_request.json"))
        ),
      pause(1),
      http("request_7")
        .get("http://" + uri1 + ":3000/static/media/footballCategory.cdedf63990a8abc504d4.jpg")
        .headers(headers_7)
        .resources(
          http("request_8")
            .get("http://" + uri1 + ":3000/static/media/cinemaCategory.3700251e39422a873b7f.jpg")
            .headers(headers_8),
          http("request_9")
            .get("http://" + uri1 + ":3000/static/media/literatureCategory.4d4361bdce02922043e6.jpg")
            .headers(headers_9),
          http("request_10")
            .get("http://" + uri1 + ":3000/static/media/countriesCategory.1804b0cc79f35da8f780.jpg")
            .headers(headers_10),
          http("request_11")
            .get("http://" + uri1 + ":3000/static/media/artCategory.7b3a6317b321ff35b188.jpg")
            .headers(headers_11),
          http("request_12")
            .get("http://" + uri1 + ":3000/static/media/allCategory.a021cf13f6e0aefd3390.jpg")
            .headers(headers_12)
        ),
      pause(10),
      http("request_13")
        .get("/questionsDB?n=30&topic=all")
        .headers(headers_13),
      pause(56),
      http("request_14")
        .options("/savestats")
        .headers(headers_5)
        .resources(
          http("request_15")
            .post("/savestats")
            .headers(headers_15)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playsolo/0015_request.json"))
        ),
      pause(2),
      http("request_16")
        .get("/getstats/registerCharge")
        .headers(headers_16)
        .resources(
          http("request_17")
            .get("/ratios-per-month/registerCharge")
            .headers(headers_17),
          http("request_18")
            .get("/games/registerCharge")
            .headers(headers_17),
          http("request_19")
            .get("http://" + uri1 + ":3000/static/media/librosHistorial.3c9c0778d4f8b079ea0e.jpg")
            .headers(headers_19)
        )
    )

	setUp(scn.inject(constantUsersPerSec(5).during(15))).protocols(httpProtocol)
}
