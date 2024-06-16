// src/components/login/styles.js

import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--color-bg); /* Use your custom variable */
  color: var(--color-white); /* Use your custom variable */
  font-family: 'Poppins', sans-serif;
  line-height: 1.7;
`;

export const Form = styled.form`
  background: var(--color-bg-variant); /* Use your custom variable */
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export const Button = styled.button`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  background: var(--color-primary); /* Use your custom variable */
  color: var(--color-bg); /* Use your custom variable */
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-variant); /* Use your custom variable */
  }
`;

export const Title = styled.h2`
  margin-bottom: 20px;
  font-size: 2.5rem; /* Adjust font size as needed */
  color: var(--color-primary); /* Use your custom variable */
`;

export const Link = styled.a`
  color: var(--color-primary); /* Use your custom variable */
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;
