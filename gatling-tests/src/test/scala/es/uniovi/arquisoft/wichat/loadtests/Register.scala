package es.uniovi.arquisoft.wichat.loadtests

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._
import java.util.UUID

class Register extends Simulation {

   val dynamicFeeder = Iterator.continually(Map(
    "email" -> (UUID.randomUUID().toString + "@example.com"),
    "username" -> ("user_" + UUID.randomUUID().toString.take(8)),
    "password" -> ("Pass" + UUID.randomUUID().toString.take(6) + "!")
  ))

  private val httpProtocol = http
    .baseUrl("http://localhost:3000")
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
  		"If-None-Match" -> """"a5197f4dd9fe05e2c6f1e336c159cb55162f4155"""",
  		"Priority" -> "u=5"
  )
  
  private val headers_4 = Map(
  		"If-None-Match" -> """"05d3dd3193240d71fb58d735b8366707fd764aa8"""",
  		"Priority" -> "u=5"
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
  
  private val uri1 = "localhost"

  private val scn = scenario("Register").feed(dynamicFeeder)
    .exec(
      http("request_0")
        .get("/")
        .headers(headers_0)
        .resources(
          http("request_1")
            .get("/static/js/main.79f675a0.js")
            .headers(headers_1),
          http("request_2")
            .get("/static/css/main.5b88c8ca.css")
            .headers(headers_2)
        ),
      pause(2),
      http("request_3")
        .get("/static/media/logo_base.07441a09d512a8dec4a4.png")
        .headers(headers_3)
        .resources(
          http("request_4")
            .get("/static/media/plat%C3%B3.37680582c3eef115c98e.jpg")
            .headers(headers_4)
        ),
      pause(15),
      http("request_5")
        .options("http://" + uri1 + ":8000/adduser")
        .headers(headers_5)
        .resources(
          http("request_6")
            .post("http://" + uri1 + ":8000/adduser")
            .headers(headers_6)
            .body(StringBody(
              """{"email":"${email}","username":"${username}","password":"${password}"}"""
        )).asJson
        )
    )

	setUp(scn.inject(constantUsersPerSec(5).during(15))).protocols(httpProtocol)
}
