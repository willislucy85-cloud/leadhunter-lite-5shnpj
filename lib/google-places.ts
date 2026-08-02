export type PlaceResult = {
    placeId: string
    name: string
    formattedAddress: string
    city: string | null
    state: string | null
    phone: string | null
    website: string | null
}

export type SearchPlacesResult =
    | { ok: true; results: PlaceResult[] }
    | { ok: false; skipped: true; reason: string }
    | { ok: false; skipped: false; error: string }

function getPlacesConfig() {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    const hasConfig = Boolean(apiKey && apiKey !== 'demo')
    return { apiKey, hasConfig }
}

const FIELD_MASK = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.addressComponents',
    'places.nationalPhoneNumber',
    'places.websiteUri',
].join(',')

export async function searchPlacesSafe(category: string, city: string, state: string): Promise<SearchPlacesResult> {
    const { apiKey, hasConfig } = getPlacesConfig()
    if (!hasConfig) {
        return { ok: false, skipped: true, reason: 'Google Places API key is missing. Set GOOGLE_PLACES_API_KEY.' }
    }

    const location = [city, state].filter((s) => s.trim()).join(', ')
    const textQuery = location ? `${category} businesses in ${location}` : `${category} businesses`

    try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey as string,
                'X-Goog-FieldMask': FIELD_MASK,
            },
            body: JSON.stringify({ textQuery, maxResultCount: 20 }),
        })
        const json = await res.json()
        if (!res.ok) {
            return { ok: false, skipped: false, error: json?.error?.message || 'Google Places request failed' }
        }
        const places = Array.isArray(json.places) ? json.places : []
        return { ok: true, results: places.map(mapPlace) }
    } catch (error) {
        return { ok: false, skipped: false, error: error instanceof Error ? error.message : 'Google Places request failed' }
    }
}

function mapPlace(place: any): PlaceResult {
    const components: { types?: string[]; longText?: string; shortText?: string }[] = place.addressComponents || []
    const city = components.find((c) => c.types?.includes('locality'))?.longText || null
    const state = components.find((c) => c.types?.includes('administrative_area_level_1'))?.shortText || null
    return {
        placeId: place.id,
        name: place.displayName?.text || 'Unknown business',
        formattedAddress: place.formattedAddress || '',
        city,
        state,
        phone: place.nationalPhoneNumber || null,
        website: place.websiteUri || null,
    }
}
