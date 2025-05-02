Feature: Game Feature
    Scenario: The user is able to start playing a game
      Given A logged user
      When I configure and start a new game
      Then The game page should be shown

    Scenario: The user is able to play a game
      Given A logged user
      When I play a game
      Then The results page should be shown

    Scenario: The user is able to restart a game
      Given A logged user
      When I play a game and start another
      Then A new question should be shown

    Scenario: The user is able to play a 20 questions game
      Given A logged user
      When The user configures a 20 questions game and plays it
      Then The results page should be shown

    Scenario: The user is able to start a 30 questions game
      Given A logged user
      When The user configures a 30 questions game and starts it
      Then A new question should be shown

    Scenario: The user is able to start a AIvsPlayer game
      Given A logged user
      When The user configures a AIvsPlayer game
      Then The results page should be shown