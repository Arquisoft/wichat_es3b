Feature: Logout and restricted access

  Scenario: After logging out, the user is redirected to /auth when clicking "Jugar"
    Given A user who is logged in
    When The user logs out
    And The user clicks the "Jugar" button
    Then I should be redirected to the "/auth" page
