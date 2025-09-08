import React from 'react';
import styled from 'styled-components';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Panel = styled.div`
  background: ${({ theme }) => theme.body === '#121212' ? '#1d1d1d' : '#ffffff'};
  color: ${({ theme }) => theme.text};
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.25);
  width: 520px;
  max-width: 92vw;
  padding: 20px 22px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.1rem;
`;

const CloseBtn = styled.button`
  background: ${({ theme }) => theme.body === '#121212' ? '#2a2a2a' : '#f0f0f0'};
  color: inherit;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
`;

const Section = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${({ theme }) => theme.body === '#121212' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const Option = styled.button`
  background: ${({ active, theme }) => active ? (theme.body === '#121212' ? '#ffffff' : '#000000') : (theme.body === '#121212' ? '#2a2a2a' : '#f5f5f5')};
  color: ${({ active, theme }) => active ? (theme.body === '#121212' ? '#000000' : '#ffffff') : 'inherit'};
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
`;

const SettingsMenu = ({ isOpen, onClose, prefs, onChange }) => {
  if (!isOpen) return null;

  const set = (key, value) => onChange({ ...prefs, [key]: value });

  return (
    <Backdrop onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Customization</Title>
          <CloseBtn onClick={onClose}>Close</CloseBtn>
        </Header>

        <Section>
          <strong>Clock style</strong>
          <Row>
            <Option active={prefs.clockStyle === 'default'} onClick={() => set('clockStyle', 'default')}>Default</Option>
            <Option active={prefs.clockStyle === 'retro8bit'} onClick={() => set('clockStyle', 'retro8bit')}>Retro 8‑bit</Option>
          </Row>
        </Section>

        <Section>
          <strong>Background pattern</strong>
          <Row>
            <Option active={prefs.pattern === 'none'} onClick={() => set('pattern', 'none')}>None</Option>
            <Option active={prefs.pattern === 'grid'} onClick={() => set('pattern', 'grid')}>Grid</Option>
            <Option active={prefs.pattern === 'dots'} onClick={() => set('pattern', 'dots')}>Dots</Option>
            <Option active={prefs.pattern === 'psy'} onClick={() => set('pattern', 'psy')}>Psy‑geometry</Option>
          </Row>
        </Section>

        <Section>
          <strong>Font</strong>
          <Row>
            <Option active={prefs.font === 'system'} onClick={() => set('font', 'system')}>System</Option>
            <Option active={prefs.font === 'mono'} onClick={() => set('font', 'mono')}>Mono</Option>
            <Option active={prefs.font === 'retro'} onClick={() => set('font', 'retro')}>Retro</Option>
          </Row>
        </Section>
      </Panel>
    </Backdrop>
  );
};

export default SettingsMenu;


