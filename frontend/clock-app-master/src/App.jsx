import React, { useEffect, useMemo, useState } from 'react';
import Clock from './components/Clock';
import WeatherWidget from './components/WeatherWidget';
import WeatherRecommendation from './components/WeatherRecommendation';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles, lightTheme, darkTheme } from './styles/GlobalStyles';
import styled, { css, keyframes } from 'styled-components';
import SettingsMenu from './components/SettingsMenu';

// Helpers for subtle background patterns
const patternStyles = ({ $pattern, theme }) => {
  const lineColor = theme.text === '#ffffff' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  switch ($pattern) {
    case 'grid':
      return {
        image: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
        size: '40px 40px',
      };
    case 'dots':
      return {
        image: `radial-gradient(${lineColor} 1px, transparent 1px), radial-gradient(${lineColor} 1px, transparent 1px)`,
        size: '24px 24px',
      };
    case 'psy':
      return {
        image: `repeating-conic-gradient(from 0deg, ${lineColor} 0deg 6deg, transparent 6deg 12deg)`,
        size: 'auto',
      };
    default:
      return { image: '', size: '' };
  }
};

const TopBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  z-index: 10;
`;

// Main App container
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px 20px;
  width: 100%;
  min-height: 100vh;
  font-family: ${({ $fontFamily }) => $fontFamily || 'inherit'};
  background-attachment: fixed;
  background-position: center;
  ${({ $bgImage, $patternConf }) => css`
    background-image: ${[$bgImage, $patternConf?.image].filter(Boolean).join(', ')};
    background-size: ${$patternConf?.image ? `auto, ${$patternConf.size}` : 'auto'};
  `}
`;

// Toggle Button for Light and Dark Mode
const ToggleButton = styled.button`
  background: ${({ theme }) => theme.body === '#121212' ? '#ffffff' : '#000000'};
  color: ${({ theme }) => theme.body === '#121212' ? '#000000' : '#ffffff'};
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.body === '#121212' ? '#f0f0f0' : '#444444'};
  }
`;

const GearButton = styled.button`
  background: ${({ theme }) => theme.body === '#121212' ? '#ffffff' : '#000000'};
  color: ${({ theme }) => theme.body === '#121212' ? '#000000' : '#ffffff'};
  border: none;
  padding: 10px 14px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: bold;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.body === '#121212' ? '#f0f0f0' : '#444444'};
  }
`;

// Seasonal badge
const SeasonBadge = styled.div`
  margin-top: 8px;
  margin-bottom: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0,0,0,0.08);
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;
`;

// Floating emoji particles
const fall = keyframes`
  0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  100% { transform: translateY(120vh) translateX(20px) rotate(30deg); opacity: 0; }
`;

const AnimationLayer = styled.div`
  pointer-events: none;
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: 0;
`;

const Particle = styled.span`
  position: absolute;
  top: -20px;
  left: ${({ $left }) => $left}%;
  animation: ${fall} ${({ $dur }) => $dur}s linear ${({ $delay }) => $delay}s infinite;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
`;

// Night scene layers
const twinkle = keyframes`
  0% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.15); }
  100% { opacity: 0.2; transform: scale(1); }
`;

const floatFirefly = keyframes`
  0% { transform: translate(0, 0); }
  50% { transform: translate(10px, -20px); }
  100% { transform: translate(0, 0); }
`;

const NightLayer = styled.div`
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
`;

const Star = styled.span`
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(255,255,255,0.9);
  border-radius: 50%;
  top: ${({ $top }) => $top}%;
  left: ${({ $left }) => $left}%;
  animation: ${twinkle} ${({ $dur }) => $dur}s ease-in-out ${({ $delay }) => $delay}s infinite;
`;

const Firefly = styled.span`
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,180,1) 0%, rgba(255,255,180,0.8) 40%, rgba(255,255,180,0) 70%);
  box-shadow: 0 0 10px 4px rgba(255,255,180,0.6);
  top: ${({ $top }) => $top}%;
  left: ${({ $left }) => $left}%;
  animation: ${floatFirefly} ${({ $dur }) => $dur}s ease-in-out ${({ $delay }) => $delay}s infinite;
`;

const fallRain = keyframes`
  0% { transform: translateY(-120px) translateX(0); opacity: 0; }
  10% { opacity: 0.4; }
  100% { transform: translateY(120vh) translateX(-30px); opacity: 0; }
`;

const Raindrop = styled.span`
  position: absolute;
  width: 1px;
  height: 60px;
  background: rgba(255,255,255,0.25);
  top: -120px;
  left: ${({ $left }) => $left}%;
  animation: ${fallRain} ${({ $dur }) => $dur}s linear ${({ $delay }) => $delay}s infinite;
`;

// CSS fireplace (winter/night)
const FireplaceWrap = styled.div`
  position: fixed;
  bottom: 18px;
  right: 18px;
  width: 140px;
  height: 120px;
  pointer-events: none;
  z-index: 1;
  opacity: 0.9;
`;

const Hearth = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 36px;
  background: linear-gradient(180deg, #3a2e2a, #231c1a);
  border-radius: 8px;
  box-shadow: inset 0 6px 12px rgba(0,0,0,0.35);
`;

const Mantle = styled.div`
  position: absolute;
  bottom: 36px;
  left: 8px;
  right: 8px;
  height: 62px;
  background: linear-gradient(180deg, #4a3b35, #2e2522);
  border-radius: 8px 8px 0 0;
  box-shadow: inset 0 -8px 16px rgba(0,0,0,0.45);
`;

const flicker = keyframes`
  0% { transform: scaleY(1) translateY(0); filter: hue-rotate(0deg); }
  50% { transform: scaleY(1.1) translateY(-2px); filter: hue-rotate(-10deg); }
  100% { transform: scaleY(1) translateY(0); filter: hue-rotate(0deg); }
`;

const Flame = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 22px;
  height: 36px;
  background: radial-gradient(circle at 50% 70%, #ffd070 0%, #ff9330 45%, rgba(255,147,48,0.0) 70%);
  filter: drop-shadow(0 0 12px rgba(255,160,60,0.8));
  border-radius: 50% 50% 45% 45% / 55% 55% 45% 45%;
  animation: ${flicker} 0.9s ease-in-out infinite;
`;

function App() {
  const [theme, setTheme] = useState('light');
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [prefs, setPrefs] = useState({ clockStyle: 'default', pattern: 'none', font: 'system' });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleWeatherData = (weatherData) => {
    setWeather(weatherData);
    setLocation(weatherData.location);
  };

  // Load and persist preferences
  useEffect(() => {
    try {
      const raw = localStorage.getItem('clockapp:prefs');
      if (raw) setPrefs(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('clockapp:prefs', JSON.stringify(prefs));
    } catch {}
  }, [prefs]);

  const fontFamily = useMemo(() => {
    switch (prefs.font) {
      case 'mono':
        return `'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`;
      case 'retro':
        return `'Press Start 2P', monospace`;
      default:
        // Subtle night font change for readability
        return theme === 'dark'
          ? `'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`
          : `Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'`;
    }
  }, [prefs.font, theme]);

  // Season and weather mood
  const { season, mood, gradient, emojis } = useMemo(() => {
    if (!weather || !location) {
      return { season: 'default', mood: 'default', gradient: theme === 'light' ? 'linear-gradient(180deg,#f0f0f0,#e6e6e6)' : 'linear-gradient(180deg,#111,#0e0e0e)', emojis: [] };
    }
    const month = new Date(weather.location.localtime || Date.now()).getMonth() + 1;
    const lat = weather.location.lat || 0;
    const isNorthern = lat >= 0;
    const seasonMapNorth = { 12: 'winter', 1: 'winter', 2: 'winter', 3: 'spring', 4: 'spring', 5: 'spring', 6: 'summer', 7: 'summer', 8: 'summer', 9: 'autumn', 10: 'autumn', 11: 'autumn' };
    const seasonMapSouth = { 12: 'summer', 1: 'summer', 2: 'summer', 3: 'autumn', 4: 'autumn', 5: 'autumn', 6: 'winter', 7: 'winter', 8: 'winter', 9: 'spring', 10: 'spring', 11: 'spring' };
    const s = (isNorthern ? seasonMapNorth : seasonMapSouth)[month] || 'default';

    const text = (weather.current?.condition?.text || '').toLowerCase();
    const mood = text.includes('rain') || text.includes('drizzle') ? 'rain'
      : text.includes('snow') || text.includes('sleet') ? 'snow'
      : text.includes('storm') || text.includes('thunder') ? 'storm'
      : text.includes('cloud') || text.includes('overcast') ? 'cloud'
      : 'clear';

    const gradientsDay = {
      spring: 'linear-gradient(180deg, #E8F7EE 0%, #CFF5D1 100%)',
      summer: 'linear-gradient(180deg, #FFF3B0 0%, #FFCF87 100%)',
      autumn: 'linear-gradient(180deg, #FFE0C3 0%, #F9B07C 100%)',
      winter: 'linear-gradient(180deg, #E6F0FF 0%, #C9D9FF 100%)',
      default: 'linear-gradient(180deg,#f0f0f0,#e6e6e6)'
    };
    const gradientsNight = {
      spring: 'linear-gradient(180deg, #0f1b15 0%, #0b1410 100%)',
      summer: 'linear-gradient(180deg, #0f1116 0%, #0a0a0a 100%)',
      autumn: 'linear-gradient(180deg, #1a1410 0%, #0f0b08 100%)',
      winter: 'linear-gradient(180deg, #0f1824 0%, #0a0f17 100%)',
      default: 'linear-gradient(180deg,#111,#0e0e0e)'
    };

    const emojiSets = {
      clear: ['☀️'],
      cloud: ['☁️'],
      rain: ['🌧️', '💧'],
      snow: ['❄️'],
      storm: ['⛈️'],
    };

    const gradient = theme === 'dark' ? (gradientsNight[s] || gradientsNight.default) : (gradientsDay[s] || gradientsDay.default);
    return { season: s, mood, gradient, emojis: emojiSets[mood] || [] };
  }, [weather, location, theme]);

  // Accent color for components (cards, headers) based on season/night
  const accent = useMemo(() => {
    const day = { spring: '#64c897', summer: '#e5b53b', autumn: '#e08449', winter: '#5b8df8', default: '#7aa0c2' };
    const night = { spring: '#2ea86f', summer: '#c6921c', autumn: '#bf6e3e', winter: '#4f7edb', default: '#5e7fa4' };
    const map = theme === 'dark' ? night : day;
    return map[season] || map.default;
  }, [season, theme]);

  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <GlobalStyles />
      <TopBar>
        <GearButton onClick={() => setSettingsOpen(true)}>Customize</GearButton>
        <ToggleButton onClick={toggleTheme}>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </ToggleButton>
      </TopBar>
      <AnimationLayer>
        {emojis.slice(0, 2).map((emo, i) => (
          [...Array(6)].map((_, j) => (
            <Particle key={`${i}-${j}`} $left={(j * 15 + i * 7) % 100} $dur={9 + j} $delay={i + j * 0.7}>{emo}</Particle>
          ))
        ))}
      </AnimationLayer>
      {theme === 'dark' && (
        <NightLayer>
          {/* Stars for clear/cloud nights */}
          {['clear','cloud'].includes(mood) && (
            [...Array(40)].map((_, i) => (
              <Star key={`s-${i}`} $top={(i * 7) % 100} $left={(i * 13) % 100} $dur={3 + (i % 5)} $delay={(i % 10) * 0.2} />
            ))
          )}
          {/* Fireflies for summer nights */}
          {season === 'summer' && mood === 'clear' && (
            [...Array(8)].map((_, i) => (
              <Firefly key={`f-${i}`} $top={(i * 11) % 100} $left={(i * 17) % 100} $dur={6 + (i % 5)} $delay={(i % 6) * 0.5} />
            ))
          )}
          {/* Rain overlay */}
          {mood === 'rain' && (
            [...Array(30)].map((_, i) => (
              <Raindrop key={`r-${i}`} $left={(i * 9) % 100} $dur={2 + (i % 4)} $delay={(i % 10) * 0.3} />
            ))
          )}
        </NightLayer>
      )}
      <AppContainer
        $pattern={prefs.pattern}
        $fontFamily={fontFamily}
        $bgImage={gradient}
        $patternConf={patternStyles({ $pattern: prefs.pattern, theme: theme === 'light' ? lightTheme : darkTheme })}
      >
        {season !== 'default' && (
          <SeasonBadge>{theme === 'dark' ? '🌙' : (emojis[0] || '')} {season.charAt(0).toUpperCase() + season.slice(1)} — {mood}</SeasonBadge>
        )}
        {/* Clock Component */}
        <Clock variant={prefs.clockStyle} />
        {/* Weather Widget */}
        <WeatherWidget onWeatherData={handleWeatherData} />
        {/* Weather Recommendation if weather data is available */}
        {weather && location && (
          <WeatherRecommendation weather={weather} location={location} />
        )}
      </AppContainer>
      <SettingsMenu
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        prefs={prefs}
        onChange={setPrefs}
      />
    </ThemeProvider>
  );
}

export default App;
