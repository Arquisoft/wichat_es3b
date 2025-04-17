Feature: Ranking Navigation

  Scenario: The user is redirected to /ranking after clicking the "Ranking" link
    Given A user who is logged in
    When I click on the "Ranking" link in the navbar
    Then I should be redirected to the "/ranking" page