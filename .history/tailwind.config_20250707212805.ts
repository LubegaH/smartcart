import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'calc(var(--radius) + 2px)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Enhanced responsive spacing
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '128': '32rem',   // 512px
      },
      // Enhanced shadows for depth
      boxShadow: {
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
        'large': '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
        'inner-soft': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      },
      // Enhanced responsive breakpoints
      screens: {
        'xs': '475px',   // Extra small phones
        'sm': '640px',   // Small tablets
        'md': '768px',   // Tablets
        'lg': '1024px',  // Small desktops
        'xl': '1280px',  // Large desktops
        '2xl': '1536px', // Extra large
      }
    },
  },
  plugins: [],
}

export default config