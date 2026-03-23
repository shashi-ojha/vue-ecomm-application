export const ROUTE_NAMES = {
  HOME: 'home',
  ABOUT: 'about',
} as const

export type RouteName = typeof ROUTE_NAMES[keyof typeof ROUTE_NAMES]