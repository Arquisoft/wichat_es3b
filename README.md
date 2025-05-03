# wichat_es3b

[![Actions Status](https://github.com/arquisoft/wichat_es3b/workflows/CI%20for%20wichat_es3b/badge.svg)](https://github.com/arquisoft/wichat_es3b/actions)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es3b&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es3b)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es3b&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es3b)

<div align="center">
<img src="webapp/src/assets/img/logo_base.png" height="100">
</div>

This is a base project for the Software Architecture course in 2024/2025. It is a basic application composed of several components.

- **User service**. Express service that handles the insertion of new users in the system.
- **Auth service**. Express service that handles the authentication of users.
- **LLM service**. Express service that handles the communication with the LLM.
- **Stats service**. Express service that provides user stats.
- **API service**. Express service that provides WIChat data through an API.
- **Gateway service**. Express service that is exposed to the public and serves as a proxy to the two previous ones.
- **Webapp**. React web application that uses the gateway service to allow basic login and new user features.

## Group member contacts

|Nombre|Email|
|------|-----|
|Enol Rodríguez Hevia | uo287935@uniovi.es|
|Alberto Fernández Azcoaga | uo179637@uniovi.es|
|David González González | uo291047@uniovi.es|
|Zinedine Álvarez Sais | uo294258@uniovi.es|
|Alejandro Vega García | uo294615@uniovi.es|
|Ignacio Llaneza Aller | uo294914@uniovi.es|
|Daniel Uría Edroso | uo282813@uniovi.es|

## Useful information
### Game Modes
WIChat offers two game modes: Solo Mode and VS AI Mode.

- **Solo Mode**: You play on your own and have the possibility to request hints from an integrated LLM. You can configure the number of questions, the time limit per question, and the number of available hints.
- **VS AI Mode**: You compete against the AI. In this mode, hints are disabled, and both you and the AI answer the same set of questions. The winner is the one who gets the most correct answers.

### Customization Options
Before starting a game, you can choose:

- The number of questions.
- The time allowed per question.
- The number of LLM hints available.
- One or more topics to focus the questions on.

### Hints
In Solo Mode, you may use hints provided by the LLM. The hints can vary depending on the type of question and can help guide you toward the correct answer.

### Statistics
WIChat allows you to view your game history and performance, including:
- Total number of games played
- Number of correct and incorrect answers
- Accuracy ratio (correct/wrong)
- Monthly evolution of your accuracy ratio in chart format
- Comparative graphs of correct vs. incorrect answers
### Rankings
The platform includes a leaderboard showing the Top 10 players with the highest scores. You can also access detailed statistics for each ranked player.

### API Access
If you wish to use WIChat’s services externally, you can request an API key by entering your email address in the designated section.



