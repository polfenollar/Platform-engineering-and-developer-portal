/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    {%- if styling == 'styled-components' %}
    styledComponents: true,
    {%- endif %}
  }
}

module.exports = nextConfig
