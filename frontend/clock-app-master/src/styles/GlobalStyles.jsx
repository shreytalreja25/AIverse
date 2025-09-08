import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  body {
    background-color: ${({ theme }) => theme.body};
    color: ${({ theme }) => theme.text};
    font-family: 'Arial', sans-serif;
    margin: 0;
    padding: 0;
    transition: background-color 0.3s, color 0.3s;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }

  * {
    box-sizing: border-box;
  }
`;

export const lightTheme = {
  body: '#f0f0f0',
  text: '#000',
};

export const darkTheme = {
  body: '#121212',
  text: '#ffffff',
};
