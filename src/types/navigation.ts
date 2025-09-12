/**
 * Navigation-related type definitions for SmartCart
 * Used by the bottom navigation and related components
 */

import { ComponentType } from 'react'
import { IconBaseProps } from 'react-icons'

export interface NavigationTab {
  /** Unique identifier for the tab */
  id: string
  /** Display label for the tab */
  label: string
  /** React icon component for the tab */
  icon: ComponentType<IconBaseProps>
  /** Route href for navigation */
  href: string
  /** Accessible label for screen readers */
  ariaLabel: string
}

export interface BottomNavProps {
  /** Optional additional CSS classes */
  className?: string
}

export type ActiveRouteDetector = (path: string) => string