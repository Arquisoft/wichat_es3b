package es.uniovi.arquisoft.wichat.loadtests

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class RecordedSimulation extends Simulation {

  private val httpProtocol = http
    .baseUrl("http://20.68.249.150:8000")
    .inferHtmlResources()
    .acceptHeader("application/json, text/plain, */*")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0")
  
  private val headers_0 = Map(
  		"Accept" -> "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  		"If-None-Match" -> """"b783e2739891c5bb055571aaafe7d761ac1b2c03"""",
  		"Priority" -> "u=0, i",
  		"Upgrade-Insecure-Requests" -> "1"
  )
  
  private val headers_1 = Map(
  		"Accept" -> "*/*",
  		"If-None-Match" -> """"c81fc8c173475a9251b6d914ef61409a380b857e""""
  )
  
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
  		"Accept" -> "*/*",
  		"Access-Control-Request-Headers" -> "content-type",
  		"Access-Control-Request-Method" -> "POST",
  		"Origin" -> "http://20.68.249.150:3000",
  		"Priority" -> "u=4"
  )
  
  private val headers_6 = Map(
  		"Content-Type" -> "application/json",
  		"Origin" -> "http://20.68.249.150:3000",
  		"Priority" -> "u=0"
  )
  
  private val headers_9 = Map("Origin" -> "http://20.68.249.150:3000")
  
  private val headers_16 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"Priority" -> "u=4, i"
  )
  
  private val headers_17 = Map(
  		"If-None-Match" -> """W/"67a-vWrz7MlaGF6Ql3z1zfDUaumtDWg"""",
  		"Origin" -> "http://20.68.249.150:3000"
  )
  
  private val headers_18 = Map(
  		"If-None-Match" -> """W/"83-ozorB1LAMrrs/aBTcRQfS7m3Wvo"""",
  		"Origin" -> "http://20.68.249.150:3000"
  )
  
  private val headers_19 = Map(
  		"If-None-Match" -> """W/"391-dPdh7jugDHIOhZVbWzDPG47f1os"""",
  		"Origin" -> "http://20.68.249.150:3000"
  )
  
  private val headers_20 = Map(
  		"If-None-Match" -> """W/"aa-pswBDr2FUxdMV0eOp2ok4HkRCd4"""",
  		"Origin" -> "http://20.68.249.150:3000"
  )
  
  private val headers_21 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"Priority" -> "u=0, i"
  )
  
  private val headers_27 = Map(
  		"Accept" -> "*/*",
  		"Origin" -> "http://20.68.249.150:3000",
  		"Priority" -> "u=4"
  )
  
  private val headers_30 = Map(
  		"Accept" -> "*/*",
  		"Content-Type" -> "application/json",
  		"Origin" -> "http://20.68.249.150:3000",
  		"Priority" -> "u=4"
  )
  
  private val headers_32 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"Priority" -> "u=5, i"
  )
  
  private val uri1 = "20.68.249.150"

  private val scn = scenario("RecordedSimulation")
    .exec(
      http("request_0")
        .get("http://" + uri1 + ":3000/")
        .headers(headers_0)
        .resources(
          http("request_1")
            .get("http://" + uri1 + ":3000/static/js/main.df4fabc2.js")
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
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/recordedsimulation/0006_request.json"))
        ),
      pause(5),
      http("request_7")
        .options("/login")
        .headers(headers_5)
        .resources(
          http("request_8")
            .post("/login")
            .headers(headers_6)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/recordedsimulation/0008_request.json"))
        ),
      pause(8),
      http("request_9")
        .get("/ratios-per-month/usuario")
        .headers(headers_9)
        .resources(
          http("request_10")
            .get("/games/usuario")
            .headers(headers_9),
          http("request_11")
            .get("/getstats/usuario")
            .headers(headers_9)
            .check(status.is(404))
        ),
      pause(5),
      http("request_12")
        .get("/getranking")
        .headers(headers_9),
      pause(5),
      http("request_13")
        .get("/getstats/prueba4")
        .headers(headers_9)
        .resources(
          http("request_14")
            .get("/games/prueba4")
            .headers(headers_9),
          http("request_15")
            .get("/ratios-per-month/prueba4")
            .headers(headers_9),
          http("request_16")
            .get("http://" + uri1 + ":3000/static/media/librosHistorial.3c9c0778d4f8b079ea0e.jpg")
            .headers(headers_16)
        ),
      pause(8),
      http("request_17")
        .get("/getranking")
        .headers(headers_17),
      pause(3),
      http("request_18")
        .get("/getstats/prueba4")
        .headers(headers_18)
        .resources(
          http("request_19")
            .get("/games/prueba4")
            .headers(headers_19),
          http("request_20")
            .get("/ratios-per-month/prueba4")
            .headers(headers_20)
        ),
      pause(10),
      http("request_21")
        .get("http://" + uri1 + ":3000/static/media/cinemaCategory.3700251e39422a873b7f.jpg")
        .headers(headers_21)
        .resources(
          http("request_22")
            .get("http://" + uri1 + ":3000/static/media/footballCategory.cdedf63990a8abc504d4.jpg")
            .headers(headers_21),
          http("request_23")
            .get("http://" + uri1 + ":3000/static/media/countriesCategory.1804b0cc79f35da8f780.jpg")
            .headers(headers_21),
          http("request_24")
            .get("http://" + uri1 + ":3000/static/media/artCategory.7b3a6317b321ff35b188.jpg")
            .headers(headers_21),
          http("request_25")
            .get("http://" + uri1 + ":3000/static/media/allCategory.a021cf13f6e0aefd3390.jpg")
            .headers(headers_21),
          http("request_26")
            .get("http://" + uri1 + ":3000/static/media/literatureCategory.4d4361bdce02922043e6.jpg")
            .headers(headers_21)
        ),
      pause(9),
      http("request_27")
        .get("/questionsDB?n=10&topic=clubes")
        .headers(headers_27),
      pause(16),
      http("request_28")
        .options("/askllm")
        .headers(headers_5),
      pause(17),
      http("request_29")
        .options("/savestats")
        .headers(headers_5)
        .resources(
          http("request_30")
            .post("/savestats")
            .headers(headers_30)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/recordedsimulation/0030_request.json"))
        ),
      pause(5),
      http("request_31")
        .get("/questionsDB?n=10&topic=all")
        .headers(headers_27)
        .resources(
          http("request_32")
            .get("http://" + uri1 + ":3000/webapp/src/assets/img/FriendlyRobotThinking.png")
            .headers(headers_32),
          http("request_33")
            .get("http://" + uri1 + ":3000/static/media/FriendlyRobotThinking.bc340152221d4917667a.png")
            .headers(headers_16)
        ),
      pause(2),
      http("request_34")
        .options("/ai-answer")
        .headers(headers_5)
    )

	setUp(scn.inject(atOnceUsers(1))).protocols(httpProtocol)
}
