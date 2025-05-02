package es.uniovi.arquisoft.wichat.loadtests

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class AskLLMDuringGame extends Simulation {

  private val httpProtocol = http
    .baseUrl("http://localhost:8000")
    .inferHtmlResources()
    .acceptHeader("*/*")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3")
    .originHeader("http://localhost:3000")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0")
  
  private val headers_0 = Map(
  		"If-None-Match" -> """W/"1af7-tY5PESG/zFpKFbWy+JjB4b8mVRE"""",
  		"Priority" -> "u=4"
  )
  
  private val headers_1 = Map(
  		"Access-Control-Request-Headers" -> "content-type",
  		"Access-Control-Request-Method" -> "POST",
  		"Priority" -> "u=4"
  )
  
  private val headers_2 = Map(
  		"Accept" -> "application/json, text/plain, */*",
  		"Content-Type" -> "application/json",
  		"Priority" -> "u=0"
  )


  private val scn = scenario("AskLLMDuringGame")
    .exec(
      http("request_0")
        .get("/questionsDB?n=10&topic=all")
        .headers(headers_0),
      pause(5),
      http("request_1")
        .options("/askllm")
        .headers(headers_1)
        .resources(
          http("request_2")
            .post("/askllm")
            .headers(headers_2)
            .body(RawFileBody("es/uniovi/arquisoft/wichat/loadtests/askllmduringgame/0002_request.json"))
        )
    )

	setUp(scn.inject(atOnceUsers(1))).protocols(httpProtocol)
}
