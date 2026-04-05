import type { Config } from 'tailwindcss';

const breakpoints = new Map([
    ['xxs', 320],
    ['xs', 375],
    ['sm', 576],
    ['md', 768],
    ['lg', 992],
    ['xl', 1200],
    ['xxl', 1400],
]);

const config: Config = {
    content: ['./app/**/*.{ts,tsx}'],
    plugins: [],
    prefix: 'e-',
    theme: {
        extend: {
            boxShadow: {
                // border for active states from Dashkit
                active: '0 0 0 0.15rem #3df51a',
            },
            colors: {
                // TODO: replace with e-text-neutral-400
                muted: 'oklch(0.6406 0.0038 174.41)', // #8a8d8c
                'heavy-metal': {
                    DEFAULT: 'oklch(21.275% 0.00721 164.22)',
                    50: 'oklch(83.058% 0.01201 161.99)',
                    100: 'oklch(80.062% 0.01471 162.38)',
                    200: 'oklch(73.7% 0.0195 166.17)',
                    300: 'oklch(67.255% 0.0243 164.16)',
                    400: 'oklch(61.003% 0.02932 162.63)',
                    500: 'oklch(53.552% 0.02379 165.43)',
                    600: 'oklch(46.048% 0.0207 163.91)',
                    700: 'oklch(38.258% 0.0166 166.31)',
                    800: 'oklch(30.098% 0.01205 160.58)',
                    900: 'oklch(21.275% 0.00721 164.22)',
                    950: 'oklch(14.676% 0.004 164.84)',
                },
                'outer-space': {
                    DEFAULT: 'oklch(24.975% 0.0089 184.49)',
                    50: 'oklch(85.627% 0.01017 181.36)',
                    100: 'oklch(82.682% 0.01236 184.01)',
                    200: 'oklch(76.402% 0.01689 187.2)',
                    300: 'oklch(70.297% 0.0218 185.24)',
                    400: 'oklch(63.845% 0.02549 186.53)',
                    500: 'oklch(56.852% 0.02498 185.95)',
                    600: 'oklch(49.437% 0.02229 184.23)',
                    700: 'oklch(41.81% 0.01838 180.95)',
                    800: 'oklch(33.501% 0.01351 189.14)',
                    900: 'oklch(24.975% 0.0089 184.49)',
                    950: 'oklch(18.651% 0.00656 178.83)',
                },
                success: {
                    DEFAULT: '#3df51a',
                    50: '#f1ffe8',
                    100: '#ddffcc',
                    200: '#bcff99',
                    300: '#90ff5c',
                    400: '#5eff2a',
                    500: '#3df51a',
                    600: '#2fd80e',
                    700: '#25aa0c',
                    800: '#1d7f0c',
                    900: '#165f0c',
                    950: '#0c3506',
                },
                accent: {
                    DEFAULT: '#3df51a',
                    50: '#f1ffe8',
                    100: '#ddffcc',
                    200: '#bcff99',
                    300: '#90ff5c',
                    400: '#5eff2a',
                    500: '#3df51a',
                    600: '#2fd80e',
                    700: '#25aa0c',
                    800: '#1d7f0c',
                    900: '#165f0c',
                    950: '#0c3506',
                },
                destructive: {
                    DEFAULT: 'oklch(73.321% 0.26321 327.1)',
                    50: 'oklch(100% 0 none)',
                    100: 'oklch(98.649% 0.01179 325.67)',
                    200: 'oklch(91.008% 0.07816 325.51)',
                    300: 'oklch(84.08% 0.14565 326.37)',
                    400: 'oklch(78.019% 0.20967 326.45)',
                    500: 'oklch(73.321% 0.26321 327.1)',
                    600: 'oklch(69.433% 0.30783 327.38)',
                    700: 'oklch(63.075% 0.29011 327.38)',
                    800: 'oklch(51.151% 0.23484 327.4)',
                    900: 'oklch(38.481% 0.17603 327.43)',
                    950: 'oklch(31.567% 0.1435 327.16)',
                },
            },
            gridTemplateColumns: {
                // Grid template for TokenExtensions
                '12-ext': 'repeat(12, minmax(0, 1fr))',
            },
        },
        /* eslint-disable sort-keys-fix/sort-keys-fix */
        screens: {
            'max-sm': getScreenDim('sm', -1),
            'max-md': getScreenDim('md', -1),
            xxs: getScreenDim('xxs'),
            xs: getScreenDim('xs'),
            sm: getScreenDim('sm'),
            md: getScreenDim('md'),
            lg: getScreenDim('lg'),
            xl: getScreenDim('xl'),
            xxl: getScreenDim('xxl'),
            mobile: getScreenDim('sm'),
            tablet: getScreenDim('md'),
            laptop: getScreenDim('lg'),
            desktop: getScreenDim('xl'),
        },
        /* eslint-enable sort-keys-fix/sort-keys-fix */
    },
};

export default config;

// adjust breakpoint 1px up see previous layout on the "edge"
function getScreenDim(label: string, shift = 1) {
    const a = breakpoints.get(label);
    if (!a) throw new Error(`Unknown breakpoint: ${label}`);
    return `${a + shift}px`;
}
