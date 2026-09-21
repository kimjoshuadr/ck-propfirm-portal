/*
 * Affiliates module data — the payload behind the converted screen.
 */

export const REFERRAL = {
  code: 'CK-KIMJOSHUA-70',
  link: 'https://ckpropfirm.com/r/kimjoshua',
  attributionDays: 30,
  discount: '70%',
}

export const FUNNEL = [
  { label: 'Link clicks', value: '1,284', meta: 'last 90 days' },
  { label: 'Sign-ups', value: '96', meta: '7.5% click-to-signup' },
  { label: 'Funded referrals', value: '7', meta: 'Silver tier · 8 more to Gold', tone: 'good', bar: 58 },
  { label: 'Commission earned', value: '$420', meta: '$420 available to withdraw', tone: 'alert' },
]

export const REFERRALS = [
  { trader: 'sable.alpha', country: 'DE', joined: '2026-09-12', joinedLabel: '12 Sep 2026', status: 'funded', commission: 60 },
  { trader: 'noct.fx', country: 'BR', joined: '2026-09-08', joinedLabel: '08 Sep 2026', status: 'funded', commission: 60 },
  { trader: 'orla.trend', country: 'IE', joined: '2026-09-02', joinedLabel: '02 Sep 2026', status: 'evaluating', commission: 0 },
  { trader: 'hiro.swing', country: 'JP', joined: '2026-08-27', joinedLabel: '27 Aug 2026', status: 'funded', commission: 60 },
  { trader: 'petra.scalp', country: 'CZ', joined: '2026-08-21', joinedLabel: '21 Aug 2026', status: 'breached', commission: 0 },
  { trader: 'abel.gold', country: 'ZA', joined: '2026-08-15', joinedLabel: '15 Aug 2026', status: 'evaluating', commission: 0 },
]

export const TIERS = [
  { tier: 'Bronze', range: '1 – 4', perFunded: 40, share: 5, current: false },
  { tier: 'Silver', range: '5 – 14', perFunded: 60, share: 8, current: true },
  { tier: 'Gold', range: '15 – 29', perFunded: 90, share: 12, current: false },
  { tier: 'Partner', range: '30+', perFunded: 120, share: 15, current: false },
]

export const PAYOUT = {
  available: 420,
  pending: 120,
  nextCycle: '01 Oct 2026',
  method: 'RisePay',
}

export const SHARE_KIT = ['Banner pack', 'Payout receipts', 'Story frames']

export const STATUS_BADGE = {
  funded: { cls: 'badge--active', label: 'funded' },
  evaluating: { cls: 'badge--pending', label: 'evaluating' },
  breached: { cls: 'badge--breached', label: 'breached' },
}
