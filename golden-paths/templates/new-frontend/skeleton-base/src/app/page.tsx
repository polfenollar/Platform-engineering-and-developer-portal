'use client';

{%- if styling == 'styled-components' %}
import styled from 'styled-components';

const Container = styled.main`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #0f172a;
  color: #f8fafc;
  font-family: sans-serif;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
`;
{%- endif %}

export default function Home() {
  {%- if styling == 'styled-components' %}
  return (
    <Container>
      <Title>Hello from ${{ name }}!</Title>
      <p>Styled using Styled Components.</p>
    </Container>
  );
  {%- elif styling == 'tailwind' %}
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-slate-50 font-sans">
      <h1 className="text-4xl font-bold">Hello from ${{ name }}!</h1>
      <p className="mt-2 text-slate-400">Styled using Tailwind CSS.</p>
    </main>
  );
  {%- else %}
  // Standard CSS / CSS Modules style
  return (
    <main style={{
      display: 'flex',
      minHeight: '100vh',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Hello from ${{ name }}!</h1>
      <p style={{ marginTop: '0.5rem', color: '#94a3b8' }}>Styled using Vanilla CSS / CSS Modules.</p>
    </main>
  );
  {%- endif %}
}
