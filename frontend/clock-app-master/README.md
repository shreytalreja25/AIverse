# Clock and Weather Recommendation App

A simple web application that displays the current time, weather conditions for your location, and a personalized activity recommendation based on the weather. The app also supports Dark Mode and uses OpenAI's GPT-4 to suggest activities.

![Screenshot](screenshot.png)

## Features

- Displays real-time clock
- Fetches the current weather based on user's geolocation
- Provides activity recommendations based on weather and time of day
- "Get Directions" button opens Google Maps to the recommended location
- Light Mode / Dark Mode toggle
- Responsive design

## Technologies Used

- **React.js** for the frontend framework
- **Styled-components** for styling
- **WeatherAPI** for fetching current weather data
- **OpenAI GPT-4** for generating activity recommendations
- **Netlify** for deployment (optional)

## Setup Instructions

### Prerequisites

Make sure you have the following installed:

- Node.js (version 12 or higher)
- npm (version 6 or higher) or yarn

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/clock-app.git
   cd clock-app
Install dependencies:

Using npm:

bash
Copy code
npm install
Or using yarn:

bash
Copy code
yarn install
Environment Variables
To use the WeatherAPI and OpenAI API, create a .env file in the root of your project and add the following environment variables:

bash
Copy code
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_WEATHER_API_KEY=your_weather_api_key_here
Replace your_openai_api_key_here with your OpenAI API key.
Replace your_weather_api_key_here with your WeatherAPI key.
Running the App
To run the app locally:

bash
Copy code
npm run dev
This will start the app on http://localhost:5173.

Building for Production
To build the app for production:

bash
Copy code
npm run build
The production-ready files will be generated in the dist/ directory.

Deploying to Netlify
Push your code to a GitHub repository.

Go to Netlify, sign in or create an account.

Click New site from Git and connect your GitHub repository.

Set the build command to:

bash
Copy code
npm run build
Set the publish directory to:

bash
Copy code
dist
Add your environment variables in the Build & Deploy section of Netlify's site settings.

Click Deploy site.

Usage
When you open the app, it will ask for permission to access your location.
Once the location is obtained, the app will fetch and display the current weather and time.
Based on the weather and time, the app will suggest an activity that you can do nearby.
You can click the "Get Directions" button to open Google Maps with directions to the suggested location.
Contributing
If you'd like to contribute to this project, feel free to fork the repository and submit a pull request.

License
This project is licensed under the MIT License - see the LICENSE file for details.