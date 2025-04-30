Feature: Profile Navigation

  Scenario: The user is redirected to /profile after clicking the "Perfil" link
    Given A user who is logged in
    When I click on the "Perfil" link in the navbar
    Then I should be redirected to the "/profile" page