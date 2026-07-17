export const STATUSES = ['New', 'Contacted', 'Engaged', 'Qualified', 'Won', 'Lost'] as const
export type LeadStatus = (typeof STATUSES)[number]

export const STATUS_COLOR: Record<LeadStatus, string> = {
    New: '#6B6F76',
    Contacted: '#C8860A',
    Engaged: '#1F6FB2',
    Qualified: '#DE470F',
    Won: '#1F8A6F',
    Lost: '#C4453A',
}

export const CATEGORIES = ['Roofing', 'HVAC', 'Solar', 'Plumbing', 'General Contractor', 'Marketing Agency', 'Other'] as const

export type Tier = 'Free' | 'Pro' | 'Business' | 'Enterprise'

export const TIERS: Record<Tier, { price: number | 'Custom'; leadsLimit: number; enrichLimit: number; sequenceLimit: number; sharedInbox: boolean; analytics: boolean }> = {
    Free: { price: 0, leadsLimit: 50, enrichLimit: 20, sequenceLimit: 1, sharedInbox: false, analytics: false },
    Pro: { price: 29, leadsLimit: Infinity, enrichLimit: Infinity, sequenceLimit: Infinity, sharedInbox: false, analytics: false },
    Business: { price: 79, leadsLimit: Infinity, enrichLimit: Infinity, sequenceLimit: Infinity, sharedInbox: true, analytics: true },
    Enterprise: { price: 'Custom', leadsLimit: Infinity, enrichLimit: Infinity, sequenceLimit: Infinity, sharedInbox: true, analytics: true },
}
