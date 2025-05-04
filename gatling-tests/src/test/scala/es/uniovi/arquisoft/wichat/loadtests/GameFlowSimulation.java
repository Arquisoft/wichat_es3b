package es.uniovi.arquisoft.wichat.loadtests;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom; // For random generation

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

public class GameFlowSimulation extends Simulation {

  // --- 1. Configuración HTTP ---
  private HttpProtocolBuilder httpProtocol = http
          // Base URL of your gateway
          .baseUrl("http://localhost:8000")
          // Common headers, add others if strictly required by your API
          .acceptHeader("application/json")
          .acceptEncodingHeader("gzip, deflate")
          .acceptLanguageHeader("es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3")
          .userAgentHeader("Gatling/PerformanceTest - Mozilla/5.0");

  // --- 2. Datos Dinámicos (Feeders) ---
  // Feeder for reading users from a CSV file
  // Ensure 'users.csv' exists in src/test/resources/data with headers: username,password
  private FeederBuilder<String> csvUserFeeder = csv("data/users.csv").circular();

  // --- 3. Lógica de Negocio / Peticiones ---

  // Define reusable chains or direct exec calls
  ChainBuilder login = feed(csvUserFeeder) // Feed username/password from CSV
          .exec(
                  http("1. Login")
                          .post("/login")
                          .header("Content-Type", "application/json") // Essential header
                          // Use Gatling Expression Language (EL) to access feeder data
                          .body(StringBody("{\"username\": \"#{username}\", \"password\": \"#{password}\"}"))
                          .asJson() // Specify that the body is JSON
                          .check(status().is(200)) // Check for successful login
                          // Extract the auth token and save it in the session
                          .check(jsonPath("$.token").exists().saveAs("authToken"))
                          // Save username for later use in URLs
                          .check(jmesPath("username").isEL("#{username}")) // Optional: verify username in response if present
          )
          .pause(Duration.ofMillis(500), Duration.ofSeconds(1)); // Pause after login

  ChainBuilder getQuestions = exec(
          http("2. Get Questions")
                  .get("/questionsDB?n=10&topic=all") // Use the correct endpoint
                  // REMOVED: Authorization header as it's not required for this endpoint
                  .check(status().is(200))
                  // CORRECTED: Check if the result is an array (count >= 0)
                  .check(jsonPath("$").count().gte(0))
  )
          .pause(Duration.ofSeconds(1), Duration.ofSeconds(3)); // Pause simulating reading questions

  ChainBuilder saveStats = exec(session -> {
    // Generate random statistics data within the session function
    int rightAnswers = ThreadLocalRandom.current().nextInt(0, 11); // 0 to 10 correct
    int wrongAnswers = 10 - rightAnswers; // Assuming 10 questions total
    int time = ThreadLocalRandom.current().nextInt(20, 61); // Time between 20s and 60s
    int score = rightAnswers * ThreadLocalRandom.current().nextInt(8, 13); // Example score calculation
    boolean win = rightAnswers > wrongAnswers;
    String currentDate = Instant.now().toString();

    // Save generated data into the session
    return session
            .set("rightAnswers", rightAnswers)
            .set("wrongAnswers", wrongAnswers)
            .set("time", time)
            .set("score", score)
            .set("win", win)
            .set("currentDate", currentDate);
  })
          // Long pause simulating gameplay
          .pause(Duration.ofSeconds(10), Duration.ofSeconds(25))
          .exec(
                  http("3. Save Stats")
                          .post("/savestats")
                          .header("Content-Type", "application/json")
                          // IMPORTANT: Add Authorization header (savestats likely needs it)
                          .header("Authorization", "Bearer #{authToken}")
                          // Build the JSON body dynamically using session data
                          .body(StringBody(session -> {
                            // Retrieve data from session
                            String username = session.getString("username"); // Username from CSV feeder
                            int rightAnswers = session.getInt("rightAnswers");
                            int wrongAnswers = session.getInt("wrongAnswers");
                            int time = session.getInt("time");
                            int score = session.getInt("score");
                            boolean win = session.getBoolean("win");
                            String date = session.getString("currentDate");

                            // Construct the JSON string - ensure field names match your API
                            return String.format(
                                    "{\"username\": \"%s\", \"rightAnswers\": %d, \"wrongAnswers\": %d, \"time\": %d, \"score\": %d, \"win\": %b, \"date\": \"%s\", \"gameMode\": \"singleplayer\"}",
                                    username, rightAnswers, wrongAnswers, time, score, win, date
                            );
                          }))
                          .asJson()
                          .check(status().is(200)) // Check for success
          )
          .pause(Duration.ofMillis(500), Duration.ofSeconds(1)); // Pause after saving stats

  ChainBuilder viewProfile = exec(
          http("4. Get Stats")
                  // Use the username from the session (originally from CSV)
                  .get("/getstats/#{username}")
                  .header("Authorization", "Bearer #{authToken}")
                  .check(status().is(200))
                  .check(jsonPath("$.username").isEL("#{username}")) // Verify username
  )
          .pause(Duration.ofMillis(300), Duration.ofMillis(800))
          .exec(
                  http("5. Get History")
                          .get("/games/#{username}")
                          .header("Authorization", "Bearer #{authToken}")
                          .check(status().is(200))
                          // CORRECTED: Check if the result is an array (count >= 0)
                          .check(jsonPath("$").count().gte(0)) // Check it's an array
          )
          .pause(Duration.ofMillis(300), Duration.ofMillis(800))
          .exec(
                  http("6. Get Ratios")
                          .get("/ratios-per-month/#{username}")
                          .header("Authorization", "Bearer #{authToken}")
                          .check(status().is(200))
                          // CORRECTED: Check if the result is an array (count >= 0)
                          .check(jsonPath("$").count().gte(0)) // Check it's an array
          );
  // Note: Ranking might be a separate scenario or less frequent action

  // --- 4. Definición del Escenario ---
  // Combine the chains to create the user flow
  private ScenarioBuilder scn = scenario("GameFlowSimulation Corrected")
          .exec(login)
          .exec(getQuestions)
          .exec(saveStats)
          .exec(viewProfile); // Chain multiple actions

  // --- 5. Configuración de la Inyección y Aserciones ---
  {
    setUp(
            scn.injectOpen(
                    // Define your load profile here
                    // atOnceUsers(10) // Example: 10 users starting at the same time
                    rampUsers(10).during(Duration.ofSeconds(30)) // Example: Ramp up 50 users over 30 seconds
                    // constantUsersPerSec(10).during(Duration.ofMinutes(1)) // Example: Constant 10 users/sec for 1 min
            ).protocols(httpProtocol)
    ).assertions(
            // Define global assertions for the simulation
            global().responseTime().max().lt(2000), // Max response time < 2000 ms
            global().responseTime().percentile(95).lt(1000), // 95th percentile < 1000 ms
            global().successfulRequests().percent().gt(98.0), // More than 98% successful requests
            // Define assertions for specific requests by name
            details("1. Login").responseTime().mean().lt(500), // Mean login time < 500 ms
            details("3. Save Stats").failedRequests().percent().lte(1.0) // Less than 1% failures for saving stats
    );
  }
}
