/// <reference types="npm:@types/react@18.3.1" />

import type * as React from 'npm:react@18.3.1'

import { template as welcomeParent } from './welcome-parent.tsx'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome-parent': welcomeParent,
}
