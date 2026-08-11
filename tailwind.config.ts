import typography from '@tailwindcss/typography'
import { type Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  plugins: [typography],
} satisfies Config
