/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"], // or 'media'
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Custom theme names using CSS variables
        "page-bg": "hsl(var(--theme-background-page))",
        "card-bg": "hsl(var(--theme-background-card))",
        "input-bg": "hsl(var(--theme-background-input))",
        'brand-yellow-light': 'hsl(var(--theme-accent-yellow-light, 48 100% 65%))', // A lighter shade for gradients
        'brand-yellow-dark': 'hsl(var(--theme-accent-yellow-dark, 38 90% 48%))',   // A richer/deeper shade for gradients

        "text-main": "hsl(var(--theme-text-primary))",
        "text-muted-fg": "hsl(var(--theme-text-secondary))", // More descriptive for foreground
        placeholder: "hsl(var(--theme-text-placeholder))",

        "brand-yellow": "hsl(var(--theme-accent-yellow))",
        "brand-yellow-hover": "hsl(var(--theme-accent-yellow-hover))",
        "text-on-brand": "hsl(var(--theme-text-on-accent))",

        link: "hsl(var(--theme-link-default))",
        "link-hover": "hsl(var(--theme-link-hover))",

        // Shadcn UI color names, now pointing to our CSS variables (defined in index.css)
        // These will be used by Shadcn components and your custom components if you use these names.
        border: "hsl(var(--border))",
        input: "hsl(var(--input))", // For input borders when using Shadcn Input component
        ring: "hsl(var(--ring))", // Default ring for focus, often overridden
        background: "hsl(var(--background))", // Should pick up --theme-background-page

        foreground: "hsl(var(--foreground))", // Should pick up --theme-text-primary
        primary: {
          DEFAULT: "hsl(var(--primary))", // Now uses --theme-accent-yellow
          foreground: "hsl(var(--primary-foreground))", // Now uses --theme-text-on-accent
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))", // Now uses --theme-text-secondary
        },
        accent: {
          DEFAULT: "hsl(var(--accent))", // Now uses --theme-accent-yellow
          foreground: "hsl(var(--accent-foreground))", // Now uses --theme-text-on-accent
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))", // Now uses --theme-background-card
          foreground: "hsl(var(--card-foreground))", // Now uses --theme-text-primary
        },
      },
      backgroundImage: {
        'golden-hour-gradient': 'linear-gradient(135deg, hsl(var(--theme-accent-yellow-light, 48 100% 65%)) 0%, hsl(var(--theme-accent-yellow)) 50%, hsl(var(--theme-accent-yellow-dark, 38 90% 48%)) 100%)',
        'golden-subtle-gradient': 'linear-gradient(to bottom right, hsl(var(--theme-accent-yellow) / 0.1), hsl(var(--theme-accent-yellow) / 0))',
      },
      borderRadius: {
        lg: "var(--radius)", // from :root
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)", // Added for more rounded options
        "2xl": "calc(var(--radius) + 8px)",
      },
      borderColor: (theme) => ({
        // Add focus border color using theme
        ...theme("colors"),
        "focus-brand": "hsl(var(--border-focus))",
      }),
      ringColor: (theme) => ({
        // Add focus ring color using theme
        ...theme("colors"),
        "focus-brand": "hsl(var(--ring-focus))",
      }),
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require('@tailwindcss/forms')],


};
