import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import { BsMapFill, BsShareFill } from "react-icons/bs";
import { PiMagicWandFill } from "react-icons/pi";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Simple fade-up animation for cards
const fadeUp = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 1100px;
  margin: 12px auto 24px auto;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const Card = styled(motion.div)`
  background-color: ${({ theme }) => theme.body === "#121212" ? "#2c2c2c" : "#f9f9f9"};
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: ${fadeUp} 320ms ease both;
  animation-delay: ${({ $delay }) => `${$delay}ms`};
  position: relative;
  min-height: 320px;
  transition: transform 200ms ease, box-shadow 200ms ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(0,0,0,0.18);
  }
`;

const Image = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  background: rgba(0,0,0,0.05);
`;

const Body = styled.div`
  padding: 16px;
  color: ${({ theme }) => theme.text};
  padding-bottom: 72px; /* space for fixed action bar */
`;

const Title = styled.div`
  font-weight: 800;
  margin-bottom: 8px;
`;

const StickyNote = styled.div`
  background: ${({ theme }) => theme.body === '#121212' ? '#ffec99' : '#fff4b3'};
  color: #1f1c14;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 3px 0 rgba(0,0,0,0.12);
  display: inline-block;
  transform: rotate(-0.5deg);
  position: relative;
  margin-bottom: 10px;
  &:after {
    content: '';
    position: absolute;
    top: -8px;
    left: 22px;
    width: 12px;
    height: 12px;
    background: ${({ theme }) => theme.body === '#121212' ? '#d2d2d2' : '#c8c8c8'};
    border-radius: 50%;
    box-shadow: inset 0 -2px 0 rgba(0,0,0,0.15);
  }
`;

const Desc = styled.p`
  margin: 0;
  line-height: 1.55;
`;

const Actions = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.body === "#121212" 
    ? 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' 
    : 'linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.02))'};
  backdrop-filter: blur(4px);
  border-top: 1px solid ${({ theme }) => theme.body === '#121212' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'};
  align-items: center;
`;

const Button = styled.button`
  background: ${({ theme }) => theme.body === "#121212" 
    ? 'linear-gradient(180deg, #ffffff, #e9e9e9)' 
    : 'linear-gradient(180deg, #3a3a3a, #262626)'};
  color: ${({ theme }) => (theme.body === "#121212" ? "#000000" : "#ffffff")};
  border: none;
  padding: 10px 14px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: ${({ theme }) => theme.body === '#121212'
    ? '0 2px 0 #cfcfcf, 0 8px 16px rgba(0,0,0,0.15)'
    : '0 2px 0 #0f0f0f, 0 8px 16px rgba(0,0,0,0.25)'};
`;

const Primary = styled(Button)`
  background: linear-gradient(180deg, #6aa2ff, #2e6de8);
  color: #fff;
`;

const Share = styled(Button)`
  background: linear-gradient(180deg, #6cd4a4, #2db37e);
  color: #0a291f;
`;

const Secondary = styled(Button)`
  font-size: 0.86rem;
  padding: 8px 10px;
  max-width: 160px;
  line-height: 1.2;
`;

const WeatherRecommendation = ({ weather, location }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shared, setShared] = useState(null);

  const parseJsonFromText = (text) => {
    try {
      const match = text.match(/\{[\s\S]*\}$/);
      const json = match ? JSON.parse(match[0]) : JSON.parse(text);
      return json;
    } catch {
      return null;
    }
  };

  const fetchImage = async (query) => {
    try {
      const key = import.meta.env.VITE_GOOGLE_CSE_KEY;
      const cx = import.meta.env.VITE_GOOGLE_CSE_CX;
      if (!key || !cx) return '';
      const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key,
          cx,
          q: query,
          searchType: 'image',
          num: 1,
          safe: 'active',
        },
      });
      return data.items && data.items.length ? data.items[0].link : '';
    } catch (e) {
      return '';
    }
  };

  const getRecommendations = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const hours = now.getHours();
      const timeOfDay = hours < 12 ? 'morning' : hours < 18 ? 'afternoon' : 'evening';

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a local guide. Return ONLY minified JSON with this exact shape:
      {"items":[{"title":"string","place":"string","description":"string"},{"title":"string","place":"string","description":"string"},{"title":"string","place":"string","description":"string"},{"title":"string","place":"string","description":"string"}]}
      Rules: 1) base on ${location.name}, ${location.country}; 2) consider weather "${weather.current.condition.text}" and ${weather.current.temp_c}°C in the ${timeOfDay}; 3) prefer nearby, safe, public places; 4) descriptions are 2–3 sentences; 5) do not include markdown or extra text.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const data = parseJsonFromText(text);
      if (!data || !Array.isArray(data.items)) throw new Error('Bad AI JSON');

      // Fetch images for each place
      const withImages = await Promise.all(
        data.items.map(async (it) => {
          const query = `${it.place}, ${location.name}, ${location.country}`;
          const imageUrl = await fetchImage(query);
          return { ...it, imageUrl };
        })
      );

      setItems(withImages);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weather && location) getRecommendations();
  }, [weather, location]);

  // Helpers for base64 safe encoding/decoding of Unicode JSON
  const encodePayload = (obj) => {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); } catch { return ''; }
  };
  const decodePayload = (str) => {
    try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch { return null; }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('shared');
    if (s) {
      const data = decodePayload(s);
      if (data) setShared(data);
    }
  }, []);

  const shareItem = async (it) => {
    const payload = {
      title: it.title,
      place: it.place,
      description: it.description,
      imageUrl: it.imageUrl || '',
      city: location?.name,
      country: location?.country,
    };
    const param = encodePayload(payload);
    const base = `${window.location.origin}${window.location.pathname}`;
    const url = `${base}?shared=${param}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${it.title} — ${it.place}`, text: 'Check this out', url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      alert('Share link copied to clipboard');
    } catch {
      prompt('Copy this link', url);
    }
  };

  const openDirections = (place) => {
    const query = encodeURIComponent(`${place}, ${location.name}, ${location.country}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  if (loading) {
    return <div>Loading recommendations...</div>;
  }

  if (!items.length) {
    return (
      <div>
        <p>No suggestions yet. Try again.</p>
        <Button onClick={getRecommendations}>Generate</Button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {shared && (
        <Card $delay={0} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {shared.imageUrl ? <Image src={shared.imageUrl} alt={shared.place} loading="lazy" /> : null}
          <Body>
            <StickyNote as={motion.div} initial={{ rotate: -1, y: -4, opacity: 0 }} animate={{ rotate: -0.5, y: 0, opacity: 1 }} transition={{ duration: 0.35 }}>
              <Title>Shared with you</Title>
            </StickyNote>
            <Title>{shared.title}</Title>
            <Title style={{ opacity: 0.8 }}>{shared.place} — {shared.city}, {shared.country}</Title>
            <Desc>{shared.description}</Desc>
          </Body>
          <Actions>
            <Primary as={motion.button} whileTap={{ scale: 0.98 }} onClick={() => openDirections(shared.place)}>
              <BsMapFill />
              Directions
            </Primary>
            <Button as={motion.button} whileTap={{ scale: 0.98 }} onClick={getRecommendations}>
              <PiMagicWandFill />
              More like this
            </Button>
            <Share as={motion.button} whileTap={{ scale: 0.98 }} onClick={() => shareItem(shared)}>
              <BsShareFill />
              Share
            </Share>
          </Actions>
        </Card>
      )}
      <Grid>
        {items.map((it, idx) => (
          <Card key={`${it.place}-${idx}`} $delay={idx * 80}>
            {it.imageUrl ? <Image src={it.imageUrl} alt={it.place} loading="lazy" /> : null}
            <Body>
              <StickyNote as={motion.div} initial={{ rotate: -1, y: -4, opacity: 0 }} animate={{ rotate: -0.5, y: 0, opacity: 1 }} transition={{ duration: 0.35 }}>
                <Title>{it.title}</Title>
              </StickyNote>
              <Title style={{ opacity: 0.8 }}>{it.place}</Title>
              <Desc>{it.description}</Desc>
            </Body>
            <Actions>
              <Primary as={motion.button} whileTap={{ scale: 0.98 }} onClick={() => openDirections(it.place)}>
                <BsMapFill />
                Directions
              </Primary>
              <Secondary as={motion.button} whileTap={{ scale: 0.98 }} onClick={getRecommendations}>
                <PiMagicWandFill />
                More like this
              </Secondary>
              <Share as={motion.button} whileTap={{ scale: 0.98 }} onClick={() => shareItem(it)}>
                <BsShareFill />
                Share
              </Share>
            </Actions>
          </Card>
        ))}
      </Grid>
    </div>
  );
};

export default WeatherRecommendation;
