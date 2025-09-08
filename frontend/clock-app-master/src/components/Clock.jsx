import React, { useState, useEffect, useRef } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { motion } from 'framer-motion';

// Subtle flip-in animation when the minute changes
const flipIn = keyframes`
  0% { transform: rotateX(75deg); opacity: 0; }
  100% { transform: rotateX(0deg); opacity: 1; }
`;

// Styling for the Clock with variants
const ClockContainer = styled(motion.div)`
  font-size: clamp(2.5rem, 14vw, 6rem);
  font-weight: bold;
  color: ${({ theme }) => theme.body === '#121212' ? '#ffffff' : '#000000'};
  text-align: center;
  margin: 24px auto 12px auto;
  width: 100%;
  will-change: transform, opacity;
  white-space: nowrap;

  ${({ $animate }) => $animate && css`
    animation: ${flipIn} 400ms ease-out;
    transform-origin: center top;
  `}

  ${({ $variant }) => $variant === 'retro8bit' && css`
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(2rem, 12vw, 4.6rem);
    letter-spacing: 4px;
    text-shadow: 0 0 0 rgba(0,0,0,0);
    image-rendering: pixelated;
  `}
`;

const Clock = ({ variant = 'default' }) => {
  const [time, setTime] = useState(new Date());
  const [animate, setAnimate] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Align to the top of the minute for a crisp clock
    const alignAndStart = () => {
      const now = new Date();
      const ms = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      const timeoutId = setTimeout(() => {
        setTime(new Date());
        setAnimate(true);
        intervalRef.current = setInterval(() => {
          setTime(new Date());
          setAnimate(true);
        }, 60000);
      }, ms);
      return timeoutId;
    };

    const timeoutId = alignAndStart();
    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Reset the animate flag after the animation ends
  useEffect(() => {
    if (!animate) return;
    const id = setTimeout(() => setAnimate(false), 450);
    return () => clearTimeout(id);
  }, [animate]);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ClockContainer
      $variant={variant}
      $animate={animate}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {formatTime(time)}
    </ClockContainer>
  );
};

export default Clock;