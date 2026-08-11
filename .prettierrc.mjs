/** @type {import("prettier").Options} */
export default {
  bracketSameLine: true,
  // Not in globe-website: this project uses Tailwind, so class sorting is needed here.
  plugins: ['prettier-plugin-tailwindcss'],
  printWidth: 100,
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  useTabs: false,
}
