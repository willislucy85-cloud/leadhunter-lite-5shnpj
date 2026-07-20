export function isAuthorizedCronRequest(request: Request) {
    const secret = process.env.CRON_SECRET
    if (!secret || secret === 'demo') return false
    return request.headers.get('authorization') === `Bearer ${secret}`
}
