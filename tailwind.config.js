/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/app/**/*.{js,ts,jsx,tsx}", 
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
  	extend: {
  		colors: {
  			/* Extended Oxford Blue scale - for flexible usage */
  			'oxford-blue': {
  				DEFAULT: '#14213D',
  				50: '#F0F2F5',
  				100: '#D9DEE7',
  				200: '#B3BDCF',
  				300: '#8D9CB7',
  				400: '#677B9F',
  				500: '#415A87',
  				600: '#2B3E5F',
  				700: '#14213D', /* DEFAULT */
  				800: '#0F1930',
  				900: '#0A1122',
  			},
  			/* Extended Gold scale - for flexible usage */
  			gold: {
  				DEFAULT: '#FEC872',
  				50: '#FFFDF8',
  				100: '#FFF7E6',
  				200: '#FFEFC9',
  				300: '#FFE0A3', /* gold-light */
  				400: '#FED48A',
  				500: '#FEC872', /* DEFAULT */
  				600: '#FEAF3A',
  				700: '#F59602',
  				800: '#BD7402',
  				900: '#855201',
  			},
  			'gold-light': '#FFE0A3',
  			/* Neutral colors */
  			black: '#000000',
  			grey: '#E5E5E5',
  			white: '#FFFFFF',
  			/* Surface colors for layered depth */
  			surface: {
  				DEFAULT: 'hsl(var(--surface))',
  				muted: 'hsl(var(--surface-muted))',
  			},
  			/* Shadcn semantic colors */
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			'primary-hover': 'var(--primary-hover)',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			'accent-hover': 'var(--accent-hover)',
  			'accent-light': 'var(--accent-light)',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		/* Custom shadow for elevated cards - increased opacity for visible depth */
		boxShadow: {
			'card': '0 1px 3px 0 rgb(0 0 0 / 0.12), 0 1px 2px -1px rgb(0 0 0 / 0.12)',
			'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.15), 0 4px 6px -4px rgb(0 0 0 / 0.15)',
			'elevated': '0 4px 6px -1px rgb(0 0 0 / 0.18), 0 2px 4px -2px rgb(0 0 0 / 0.18)',
		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
