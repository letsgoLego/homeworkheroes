/// <reference types="npm:@types/react@18.3.1" />

import type * as React from 'npm:react@18.3.1'

import { template as welcomeParent } from './welcome-parent.tsx'
import { template as helpQuestion } from './help-question.tsx'
import { template as onboardingChildAdded } from './onboarding-child-added.tsx'
import { template as onboardingChildLogin } from './onboarding-child-login.tsx'
import { template as onboardingFirstHomework } from './onboarding-first-homework.tsx'
import { template as onboardingPowerTips } from './onboarding-power-tips.tsx'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome-parent': welcomeParent,
  'help-question': helpQuestion,
  'onboarding-child-added': onboardingChildAdded,
  'onboarding-child-login': onboardingChildLogin,
  'onboarding-first-homework': onboardingFirstHomework,
  'onboarding-power-tips': onboardingPowerTips,
}
