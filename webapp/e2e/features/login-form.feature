Feature: Login Feature

  Scenario: The user is able to log in successfully
    Given A user who wants to log in
    When I enter valid credentials and click login
    Then I should be redirected to the home page
