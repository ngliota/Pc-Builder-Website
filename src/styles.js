import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

  * {
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    box-sizing: border-box;
    list-style: none;
    text-decoration: none;
  }

  :root {
    --color-bg: #1f1f38;
    --color-bg-variant: #2c2c6c;
    --color-primary: #4db5ff;
    --color-primary-variant: rgba(77, 181, 255, 0.4);
    --color-white: #fff;
    --color-light: rgba(255, 255, 255, 0.6);

    --transition: all 400ms ease;

    --container-width-lg: 75%;
    --container-width-md: 86%;
    --container-width-sm: 90%;
  }

  html {
    scroll-behavior: smooth;
  }

  ::-webkit-scrollbar {
    display: none;
  }

  body {
    font-family: 'Poppins', sans-serif;
    background: var(--color-bg);
    color: var(--color-white);
    line-height: 1.7;
    background-image: url('../src/assets/bg-texture.png');
  }

  /* ============= General Styles ============= */
  .container {
    width: var(--container-width-lg);
    margin: 0 auto;
  }

  h1, 
  h2, 
  h3, 
  h4, 
  h5 {
    font-weight: 500;
  }

  h1 {
    font-size: 2.5rem;
  }

  section {
    margin-top: 8rem;
  }

  section > h2, 
  section > h5 {
    text-align: center;
    color: var(--color-light);
  }

  section > h2 {
    color: var(--color-primary);
    margin-bottom: 3rem;
  }

  .text-light {
    color: var(--color-light);
  }

  a {
    color: var(--color-primary);
    transition: var(--transition);
  }

  a:hover {
    color: var(--color-white);
  }

  .btn {
    width: max-content;
    display: inline-block;
    color: var(--color-primary);
    padding: 0.75rem 1.2rem;
    border-radius: 0.4rem;
    cursor: pointer;
    border: 1px solid var(--color-primary);
    transition: var(--transition);
  }

  .btn:hover {
    background: var(--color-white);
    color: var(--color-bg);
    border-color: transparent;
  }

  .btn-primary {
    background: var(--color-primary);
    color: var(--color-bg);
  }

  img {
    display: block;
    width: 100%;
    object-fit: cover;
  }

  /* ============= Media Queries (Medium Devices) ============= */
  @media screen and (max-width: 1024px) {
    .container {
      width: var(--container-width-md);
    }

    section {
      margin-top: 6rem;
    }
  }

  /* ============= Media Queries (Small Devices) ============= */
  @media screen and (max-width: 600px) {
    .container {
      width: var(--container-width-sm);
    }

    section > h2 {
      margin-bottom: 2rem;
    }
  }
`;

export const Container = styled.div`
  width: var(--container-width-lg);
  margin: 0 auto;
`;

export const Section = styled.section`
  margin-top: 8rem;
`;

export const Title = styled.h1`
  font-size: 2.5rem;
`;

export const Subtitle = styled.h5`
  color: var(--color-light);
`;

export const Button = styled.button`
  width: max-content;
  display: inline-block;
  color: var(--color-primary);
  padding: 0.75rem 1.2rem;
  border-radius: 0.4rem;
  cursor: pointer;
  border: 1px solid var(--color-primary);
  transition: var(--transition);

  &:hover {
    background: var(--color-white);
    color: var(--color-bg);
    border-color: transparent;
  }

  &.btn-primary {
    background: var(--color-primary);
    color: var(--color-bg);
  }
`;

export const Image = styled.img`
  display: block;
  width: 100%;
  object-fit: cover;
`;
