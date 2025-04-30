Feature: View the Ranking Page

  Scenario: The user accesses the Ranking page from the Home page
    Given The user is on the Home page
    When The user clicks on the "Ranking" link in the navigation bar
    Then The user should be redirected to the "Ranking" page
