module.exports = {
  content: [
    './index.html',
    './{App,index,main}.tsx',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #0B3B6E)',
          accent: 'var(--brand-accent, #18B9C2)'
        }
      }
    }
  },
  plugins: []
};
