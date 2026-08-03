/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: {
  			DEFAULT: '1.5rem',
  			sm: '2rem'
  		},
  		screens: {
  			'2xl': '1200px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: '#FFC300',
  				foreground: '#111827'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			neutral: {
  				DEFAULT: '#333333'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			/* Namespace additif des applications internes (/apps/*) — valeurs dans
  			   src/app/apps/apps-theme.css. Aucune clé existante ci-dessus n'est
  			   touchée : la vitrine publique n'est pas concernée. */
  			app: {
  				bg: 'var(--app-bg)',
  				surface: 'var(--app-surface)',
  				'surface-2': 'var(--app-surface-2)',
  				'surface-hover': 'var(--app-surface-hover)',
  				border: 'var(--app-border)',
  				'border-strong': 'var(--app-border-strong)',
  				fg: 'var(--app-fg)',
  				'fg-muted': 'var(--app-fg-muted)',
  				'fg-faint': 'var(--app-fg-faint)',
  				accent: 'var(--app-accent)',
  				'accent-foreground': 'var(--app-accent-foreground)',
  				danger: 'var(--app-danger)',
  				'info-bg': 'var(--app-info-bg)',
  				'info-fg': 'var(--app-info-fg)',
  				'success-bg': 'var(--app-success-bg)',
  				'success-fg': 'var(--app-success-fg)',
  				'warning-bg': 'var(--app-warning-bg)',
  				'warning-fg': 'var(--app-warning-fg)',
  				'danger-bg': 'var(--app-danger-bg)',
  				'danger-fg': 'var(--app-danger-fg)'
  			},
  			/* Namespace additif dédié au module Venator (refonte esthétique 07/2026).
  			   Ne touche à aucune clé existante ci-dessus — voir
  			   src/app/apps/venator/venator-theme.css pour les valeurs des variables. */
  			venator: {
  				bg: 'var(--venator-bg)',
  				surface: 'var(--venator-surface)',
  				'surface-2': 'var(--venator-surface-2)',
  				'surface-hover': 'var(--venator-surface-hover)',
  				border: 'var(--venator-border)',
  				'border-strong': 'var(--venator-border-strong)',
  				fg: 'var(--venator-fg)',
  				'fg-muted': 'var(--venator-fg-muted)',
  				'fg-faint': 'var(--venator-fg-faint)',
  				accent: 'var(--venator-accent)',
  				'accent-foreground': 'var(--venator-accent-foreground)',
  				danger: 'var(--venator-danger)'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
}
