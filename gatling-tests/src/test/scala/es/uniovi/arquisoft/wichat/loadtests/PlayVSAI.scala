package es.uniovi.arquisoft.wichat.loadtests

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class PlayVSAI extends Simulation {

  private val httpProtocol = http
    .baseUrl("http://localhost:8000")
    .inferHtmlResources()
    .acceptHeader("*/*")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0")
  
  private val headers_0 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"If-None-Match" -> """"8053ea886fdf2656726dc5b9fefd836779f42919"""",
  		"Priority" -> "u=0, i"
  )
  
  private val headers_1 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"If-None-Match" -> """"ec21b846aa914221cfb610e8acb180e7dd7b0b81"""",
  		"Priority" -> "u=1, i"
  )
  
  private val headers_2 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"If-None-Match" -> """"94002aabafcfb7860bc1dbb238b9069060b8c504"""",
  		"Priority" -> "u=1, i"
  )
  
  private val headers_3 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"If-None-Match" -> """"357346d3f724fdf59fdd1bd9245acae51e3b0757"""",
  		"Priority" -> "u=1, i"
  )
  
  private val headers_4 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"If-None-Match" -> """"8800fbca00886dc6e65f135750cdefba7ed81b73"""",
  		"Priority" -> "u=1, i"
  )
  
  private val headers_5 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"If-None-Match" -> """"55fb7d086dcae2d5dca6be6160179ffd8ef21f18"""",
  		"Priority" -> "u=1, i"
  )
  
  private val headers_6 = Map(
  		"Origin" -> "http://localhost:3000",
  		"Priority" -> "u=4"
  )
  
  private val headers_7 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"Priority" -> "u=5, i"
  )
  
  private val headers_8 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"If-None-Match" -> """"0a853888e8eb4df274f22a0c7623ae8e1a805c77"""",
  		"Priority" -> "u=4, i"
  )
  
  private val headers_9 = Map(
  		"Access-Control-Request-Headers" -> "content-type",
  		"Access-Control-Request-Method" -> "POST",
  		"Origin" -> "http://localhost:3000",
  		"Priority" -> "u=4"
  )
  
  private val headers_10 = Map(
  		"Content-Type" -> "application/json",
  		"Origin" -> "http://localhost:3000",
  		"Priority" -> "u=4"
  )
  
  private val uri1 = "localhost"

  private val scn = scenario("PlayVSAI")
    .exec(
      http("request_0")
        .get("http://" + uri1 + ":3000/static/media/allCategory.a021cf13f6e0aefd3390.jpg")
        .headers(headers_0)
        .resources(
          http("request_1")
            .get("http://" + uri1 + ":3000/static/media/countriesCategory.1804b0cc79f35da8f780.jpg")
            .headers(headers_1),
          http("request_2")
            .get("http://" + uri1 + ":3000/static/media/footballCategory.cdedf63990a8abc504d4.jpg")
            .headers(headers_2),
          http("request_3")
            .get("http://" + uri1 + ":3000/static/media/artCategory.7b3a6317b321ff35b188.jpg")
            .headers(headers_3),
          http("request_4")
            .get("http://" + uri1 + ":3000/static/media/cinemaCategory.3700251e39422a873b7f.jpg")
            .headers(headers_4),
          http("request_5")
            .get("http://" + uri1 + ":3000/static/media/literatureCategory.4d4361bdce02922043e6.jpg")
            .headers(headers_5)
        ),
      pause(20),
      http("request_6")
        .get("/questionsDB?n=10&topic=all")
        .headers(headers_6)
        .resources(
          http("request_7")
            .get("http://" + uri1 + ":3000/webapp/src/assets/img/FriendlyRobotThinking.png")
            .headers(headers_7),
          http("request_8")
            .get("http://" + uri1 + ":3000/static/media/FriendlyRobotThinking.bc340152221d4917667a.png")
            .headers(headers_8)
        ),
      pause(5),
      http("request_9")
        .options("/ai-answer")
        .headers(headers_9)
        .resources(
          http("request_10")
            .post("/ai-answer")
            .headers(headers_10)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playvsai/0010_request.json"))
        ),
      pause(5),
      http("request_11")
        .options("/ai-answer")
        .headers(headers_9)
        .resources(
          http("request_12")
            .post("/ai-answer")
            .headers(headers_10)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playvsai/0012_request.json"))
        ),
      pause(4),
      http("request_13")
        .options("/ai-answer")
        .headers(headers_9)
        .resources(
          http("request_14")
            .post("/ai-answer")
            .headers(headers_10)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playvsai/0014_request.json"))
        ),
      pause(4),
      http("request_15")
        .options("/ai-answer")
        .headers(headers_9)
        .resources(
          http("request_16")
            .post("/ai-answer")
            .headers(headers_10)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playvsai/0016_request.json"))
        ),
      pause(7),
      http("request_17")
        .options("/ai-answer")
        .headers(headers_9)
        .resources(
          http("request_18")
            .post("/ai-answer")
            .headers(headers_10)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playvsai/0018_request.json"))
        ),
      pause(2),
      http("request_19")
        .post("/ai-answer")
        .headers(headers_10)
        .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playvsai/0019_request.json")),
      pause(2),
      http("request_20")
        .options("/ai-answer")
        .headers(headers_9)
        .resources(
          http("request_21")
            .post("/ai-answer")
            .headers(headers_10)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playvsai/0021_request.json"))
        ),
      pause(3),
      http("request_22")
        .post("/ai-answer")
        .headers(headers_10)
        .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playvsai/0022_request.json")),
      pause(2),
      http("request_23")
        .options("/ai-answer")
        .headers(headers_9)
        .resources(
          http("request_24")
            .post("/ai-answer")
            .headers(headers_10)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playvsai/0024_request.json"))
        ),
      pause(3),
      http("request_25")
        .post("/ai-answer")
        .headers(headers_10)
        .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playvsai/0025_request.json"))
        .resources(
          http("request_26")
            .options("/savestats")
            .headers(headers_9),
          http("request_27")
            .post("/savestats")
            .headers(headers_10)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/playvsai/0027_request.json"))
            .check(status.is(400))
        )
    )

	setUp(scn.inject(constantUsersPerSec(5).during(15))).protocols(httpProtocol)
}
