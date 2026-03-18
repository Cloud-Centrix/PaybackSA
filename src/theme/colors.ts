export const Colors = {
    // Primary palette from design system
    teal: '#2D7987',
    tealLight: '#3A8F9E',
    tealDark: '#1F5A65',

    coral: '#E98F78',
    coralLight: '#F0A996',
    coralDark: '#D4755C',

    gold: '#D8BF80',
    goldLight: '#E5D4A4',
    goldDark: '#C4A85E',

    sand: '#E9C46A',
    sandLight: '#F0D590',
    sandDark: '#D4AD4A',

    // Neutrals
    white: '#FFFFFF',
    offWhite: '#F5F3EF',
    background: '#F8F6F2',
    cardBg: '#FFFFFF',
    border: '#E8E4DE',
    borderLight: '#F0EDE8',

    // Text
    textPrimary: '#2C2C2C',
    textSecondary: '#6B6B6B',
    textTertiary: '#9B9B9B',
    textInverse: '#FFFFFF',

    // Semantic
    success: '#5CB85C',
    error: '#E5604E',
    warning: '#E9C46A',
    info: '#2D7987',

    // Shadows
    shadowColor: '#2D7987',
} as const;

export type ColorName = keyof typeof Colors;
