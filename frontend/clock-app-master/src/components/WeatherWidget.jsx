import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

// Styling for the Weather Widget
const WeatherContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${({ theme }) => theme.body === '#121212' ? '#2c2c2c' : '#f9f9f9'};
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 0 auto 30px;  // Center the container
  max-width: 600px;  // Set a consistent max-width
`;


const WeatherInfo = styled.div`
  display: flex;
  align-items: center;
`;

const WeatherIcon = styled.img`
  width: 60px;
  height: 60px;
  margin-right: 15px;
`;

const WeatherText = styled.div`
  font-size: 1.5rem;
`;

const WeatherWidget = ({ onWeatherData }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async (lat, lon) => {
    try {
      const API_KEY = '6c23985074dc48fbacc182254242109';
      const response = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${lat},${lon}&aqi=no`
      );
      setWeather(response.data);
      onWeatherData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError("Unable to fetch weather data");
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error: ", error);
          setError("Unable to retrieve location");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  if (loading) return <WeatherContainer>Loading weather...</WeatherContainer>;
  if (error) return <WeatherContainer>{error}</WeatherContainer>;

  return (
    <WeatherContainer>
      {weather && (
        <WeatherInfo>
          <WeatherIcon
            src={weather.current.condition.icon}
            alt="Weather Icon"
          />
          <WeatherText>
            <div>{weather.location.name}, {weather.location.country}</div>
            <div>{Math.round(weather.current.temp_c)}°C</div>
            <div>{weather.current.condition.text}</div>
          </WeatherText>
        </WeatherInfo>
      )}
    </WeatherContainer>
  );
};

export default WeatherWidget;
