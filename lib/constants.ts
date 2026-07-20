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

export const SEQUENCE_STEP_TYPES = ['email', 'sms', 'status_change', 'follow_up'] as const

export const SEQUENCE_STEP_LABEL: Record<(typeof SEQUENCE_STEP_TYPES)[number], string> = {
    email: 'Send email',
    sms: 'Send SMS',
    status_change: 'Change status',
    follow_up: 'Set follow-up reminder',
}

export const AUTOMATION_TRIGGERS = ['follow_up_overdue', 'high_intent_new', 'stalled_lead'] as const

export const AUTOMATION_TRIGGER_LABEL: Record<(typeof AUTOMATION_TRIGGERS)[number], string> = {
    follow_up_overdue: 'Follow-up is overdue',
    high_intent_new: 'High-intent lead is still New',
    stalled_lead: 'No activity for N days',
}

export const AUTOMATION_TRIGGER_DESCRIPTION: Record<(typeof AUTOMATION_TRIGGERS)[number], string> = {
    follow_up_overdue: 'Fires once per lead whose follow-up date has passed and is still open.',
    high_intent_new: 'Fires once per lead scoring 70+ that is still in New status.',
    stalled_lead: 'Fires once per open lead with no activity for the configured number of days.',
}

export type Tier = 'Free' | 'Pro' | 'Business' | 'Enterprise'

export const TIERS: Record<Tier, { price: number | 'Custom'; leadsLimit: number; enrichLimit: number; sequenceLimit: number; sharedInbox: boolean; analytics: boolean }> = {
    Free: { price: 0, leadsLimit: 50, enrichLimit: 20, sequenceLimit: 1, sharedInbox: false, analytics: false },
    Pro: { price: 29, leadsLimit: Infinity, enrichLimit: Infinity, sequenceLimit: Infinity, sharedInbox: false, analytics: false },
    Business: { price: 79, leadsLimit: Infinity, enrichLimit: Infinity, sequenceLimit: Infinity, sharedInbox: true, analytics: true },
    Enterprise: { price: 'Custom', leadsLimit: Infinity, enrichLimit: Infinity, sequenceLimit: Infinity, sharedInbox: true, analytics: true },
}
