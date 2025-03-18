"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Chat from "./LLMChat/LLMChat"
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Box,
  Container,
  Paper,
  CircularProgress,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"
import PhoneIcon from "@mui/icons-material/Phone"
import ChatIcon from "@mui/icons-material/Chat"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn"

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000"

// Custom styled components
const GameContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  minHeight: "100vh",
  background: "linear-gradient(to bottom right, #e8f5fe, #f0e6ff)",
}))

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: "linear-gradient(to right, #3f51b5, #7e57c2)",
  boxShadow: theme.shadows[3],
}))

const LogoButton = styled(Button)(({ theme }) => ({
  fontSize: "1.5rem",
  fontWeight: "bold",
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
}))

const ScoreChip = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: "#303f9f",
  color: theme.palette.common.white,
  borderRadius: 20,
  display: "inline-flex",
  alignItems: "center",
  fontWeight: "bold",
}))

const CoinsChip = styled(Button)(({ theme }) => ({
  backgroundColor: "#ffc107",
  color: "#333",
  borderRadius: 20,
  fontWeight: "bold",
  "&:hover": {
    backgroundColor: "#ffb300",
  },
}))

const LifelineButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isUsed" && prop !== "colorVariant",
})(({ theme, isUsed, colorVariant }) => ({
  width: "100%",
  marginBottom: theme.spacing(2),
  backgroundColor: isUsed
    ? theme.palette.grey[300]
    : colorVariant === "blue"
      ? theme.palette.primary.main
      : colorVariant === "green"
        ? theme.palette.success.main
        : theme.palette.secondary.main,
  color: isUsed ? theme.palette.text.disabled : theme.palette.common.white,
  "&:hover": {
    backgroundColor: isUsed
      ? theme.palette.grey[300]
      : colorVariant === "blue"
        ? theme.palette.primary.dark
        : colorVariant === "green"
          ? theme.palette.success.dark
          : theme.palette.secondary.dark,
    transform: isUsed ? "none" : "scale(1.03)",
  },
  transition: theme.transitions.create(["background-color", "transform"], {
    duration: theme.transitions.duration.short,
  }),
}))

const OptionButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isHidden",
})(({ theme, isHidden }) => ({
  padding: theme.spacing(2),
  fontSize: "1rem",
  visibility: isHidden ? "hidden" : "visible",
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
    transform: "scale(1.03)",
    boxShadow: theme.shadows[4],
  },
  transition: theme.transitions.create(["background-color", "transform", "box-shadow"], {
    duration: theme.transitions.duration.short,
  }),
}))

const ImageContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  marginBottom: theme.spacing(3),
  "& img": {
    maxHeight: 250,
    objectFit: "cover",
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
  },
}))

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(6),
  height: "100%",
  minHeight: 300,
}))

function Game() {
  const [round, setRound] = useState(1)
  const totalRounds = 10
  const [roundData, setRoundData] = useState(null)
  const [score, setScore] = useState(0)
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false)
  const [callFriendUsed, setCallFriendUsed] = useState(false)
  const [useChatUsed, setUseChatUsed] = useState(false)
  const [hiddenOptions, setHiddenOptions] = useState([])
  const [loading, setLoading] = useState(true)

  // Function to load the data for each round.
  const loadRound = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${apiEndpoint}/getRound`)
      console.log("Get Round")
      console.log(response.data)
      setHiddenOptions([])
      setLoading(false)
      return response.data
    } catch (error) {
      console.error("Error fetching data from question service:", error)
      setLoading(false)
    }
  }

  const gameSetup = async () => {
    try {
      setLoading(true)
      // Loads the questions from wikidata into the database
      await axios.post(`${apiEndpoint}/loadQuestion`)
      // First round
      const data = await loadRound()
      setRoundData(data)
    } catch (error) {
      console.error("Error fetching data from question service:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    gameSetup()
  }, []);

  const handleOptionSelect = async (index) => {
    const isCorrect = CorrectOption(index)
    if (isCorrect) {
      setScore(score + 50)
    }

    if (round === totalRounds) {
      alert("Game Over")
      setRoundData(null)
      setRound(1)
      setScore(0)
      setFiftyFiftyUsed(false)
      setCallFriendUsed(false)
      setUseChatUsed(false)
      setHiddenOptions([])
      gameSetup()
      return
    }

    setRound(round + 1)
    setRoundData(null)
    setLoading(true)

    try {
      const data = await loadRound()
      setRoundData(data)
    } catch (error) {
      console.error("Error loading new round", error)
      setLoading(false)
    }
  }

  const CorrectOption = (index) => {
    if (!roundData) return false
    const selectedName = roundData.cities[index].name
    const correctName = roundData.cityWithImage.name
    return selectedName === correctName
  }

  const handleFiftyFifty = () => {
    if (fiftyFiftyUsed || !roundData) return

    // Find the correct answer index
    const correctIndex = roundData.cities.findIndex((city) => city.name === roundData.cityWithImage.name)

    // Get two random incorrect indices
    let incorrectIndices = [0, 1, 2, 3].filter((i) => i !== correctIndex)
    // Shuffle and take first two
    incorrectIndices = incorrectIndices.sort(() => 0.5 - Math.random()).slice(0, 2)

    setHiddenOptions(incorrectIndices)
    setFiftyFiftyUsed(true)
  }

  const handleCallFriend = () => {
    if (callFriendUsed || !roundData) return
    // Implement logic to simulate calling a friend
    alert("Your friend thinks the answer might be: " + roundData.cityWithImage.name)
    setCallFriendUsed(true)
  }

  const handleUseChat = () => {
    if (useChatUsed || !roundData) return
    // Implement logic to use the chat
    alert("Chat is now available to help you!")
    setUseChatUsed(true)
  }

  return (
    <GameContainer maxWidth="100%">
      {/* Top Bar */}
      <StyledAppBar position="static">
        <Toolbar>
          <LogoButton color="inherit" disableRipple>
            TRIVIA
          </LogoButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <CoinsChip variant="contained" startIcon={<MonetizationOnIcon />}>
              Coins
            </CoinsChip>
            <ScoreChip elevation={0}>
              <EmojiEventsIcon sx={{ mr: 1 }} />
              Score: {score}
            </ScoreChip>
          </Box>
        </Toolbar>
      </StyledAppBar>

      {/* Main Content */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Left Side (Lifelines) */}
        <Grid item xs={12} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="h3" gutterBottom color="primary">
                Lifelines
              </Typography>
              <LifelineButton
                variant="contained"
                startIcon={<HelpOutlineIcon />}
                onClick={handleFiftyFifty}
                disabled={fiftyFiftyUsed}
                isUsed={fiftyFiftyUsed}
                colorVariant="blue"
              >
                50/50 - 100 🪙 {fiftyFiftyUsed && "(Used)"}
              </LifelineButton>
              <LifelineButton
                variant="contained"
                startIcon={<PhoneIcon />}
                onClick={handleCallFriend}
                disabled={callFriendUsed}
                isUsed={callFriendUsed}
                colorVariant="green"
              >
                Call a Friend - 150 🪙 {callFriendUsed && "(Used)"}
              </LifelineButton>
              <LifelineButton
                variant="contained"
                startIcon={<ChatIcon />}
                onClick={handleUseChat}
                disabled={useChatUsed}
                isUsed={useChatUsed}
                colorVariant="purple"
              >
                Use the Chat - 200 🪙 {useChatUsed && "(Used)"}
              </LifelineButton>
            </CardContent>
          </Card>
        </Grid>

        {/* Game Area */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ minHeight: 400 }}>
            <CardContent>
              {loading ? (
                <LoadingContainer>
                  <CircularProgress size={60} thickness={4} color="primary" />
                  <Typography variant="h6" color="textSecondary" sx={{ mt: 3 }}>
                    Loading question...
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Get ready for round {round}!
                  </Typography>
                </LoadingContainer>
              ) : (
                roundData && (
                  <>
                    <Typography variant="h4" component="h2" align="center" gutterBottom color="primary">
                      Round {round}/{totalRounds}
                    </Typography>
                    <ImageContainer>
                      <img
                        src={roundData.cityWithImage.imageUrl || "/placeholder.svg"}
                        alt={roundData.cityWithImage.imageAltText || "City image"}
                      />
                    </ImageContainer>
                    <Grid container spacing={2}>
                      {roundData.cities.map((city, index) => (
                        <Grid item xs={6} key={index}>
                          <OptionButton
                            variant="contained"
                            fullWidth
                            onClick={() => handleOptionSelect(index)}
                            disabled={hiddenOptions.includes(index)}
                            isHidden={hiddenOptions.includes(index)}
                          >
                            {city.name}
                          </OptionButton>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side (Chat) */}
        <Grid item xs={12} md={3}>
          <Card elevation={3} sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5" component="h3" gutterBottom color="primary">
                Chat
              </Typography>
              <Box
                sx={{
                  height: 400,
                  overflow: "auto",
                  bgcolor: "background.default",
                  borderRadius: 1,
                  p: 2,
                }}
              >
                <Chat />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </GameContainer>
  )
}

export default Game

