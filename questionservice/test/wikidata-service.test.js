const { fetchAndStoreCities, getRandomCitiesWithImage, getCityNameById } = require("../service/wikidata-service");
const City = require("../model/wikidata-model");

// Import axios for mocking
const axios = require("axios");
// Mock axios to avoid real API calls
jest.mock("axios");

// Mock Mongoose to avoid real database interactions
jest.mock("../model/wikidata-model");

describe("WikiData Service Tests", () => {
  
  // Silence console.error before each test
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  // Restore console.error after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test 1: fetchAndStoreCities should fetch and store cities in MongoDB
  test("fetchAndStoreCities should fetch data from WikiData and store it in MongoDB", async () => {
    // Mock WikiData API response
    axios.get.mockResolvedValueOnce({
      data: {
        results: {
          bindings: [
            {
              city: { value: "https://wikidata.org/wiki/Q1" }, // City ID
              cityLabel: { value: "Test City" }, // City Name
              image: { value: "url1" } // City Image URL
            }
          ]
        }
      }
    });

    // Mock the database update operation
    City.findOneAndUpdate.mockResolvedValueOnce({ id: "Q1", name: "Test City", imageUrl: "url1" });

    // Call the function to test
    await fetchAndStoreCities();

    // Verify that findOneAndUpdate was called with the correct parameters
    expect(City.findOneAndUpdate).toHaveBeenCalledWith(
      { id: "Q1" }, // Search criteria
      { id: "Q1", name: "Test City", imageUrl: "url1", imageAltText: expect.any(String) }, // Data to store
      { upsert: true, new: true } // Options: insert if not found, return updated document
    );
  });

  // Test 2: getRandomCitiesWithImage should return 4 random cities and an image URL
  test("getRandomCitiesWithImage should return 4 random cities", async () => {
    // Mock database response with 4 cities
    const mockCities = [
      { id: "Q1", name: "City1", imageUrl: "url1" },
      { id: "Q2", name: "City2", imageUrl: "url2" },
      { id: "Q3", name: "City3", imageUrl: "url3" },
      { id: "Q4", name: "City4", imageUrl: "url4" }
    ];
    
    City.aggregate.mockResolvedValueOnce(mockCities);
    
    // Call the function
    const result = await getRandomCitiesWithImage();
    
    // Verify that 4 cities are returned
    expect(result.cities).toHaveLength(4);
    
    // Verify that an image URL is included
    expect(result.imageUrl).toBeDefined();
  });

  // Test 3: getCityNameById should return the correct city name
  test("getCityNameById should return city name for valid id", async () => {
    // Mock database response for a valid city
    const mockCity = { id: "Q1", name: "Test City" };
    City.findOne.mockResolvedValueOnce(mockCity);
    
    // Call the function
    const name = await getCityNameById("Q1");

    // Verify the correct city name is returned
    expect(name).toBe("Test City");
  });

  // Test 4: getCityNameById should throw an error if the city is not found
  test("getCityNameById should throw error if city not found", async () => {
    // Mock database response with no city found
    City.findOne.mockResolvedValueOnce(null);

    // Call the function and expect an error to be thrown
    await expect(getCityNameById("Q99")).rejects.toThrow("City with id Q99 not found");
  });

});
