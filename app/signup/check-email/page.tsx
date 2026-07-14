import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function CheckEmail() {
    return (
        <div className="flex items-center justify-center bg-muted min-h-screen">
            <Card className="w-[380px] mx-auto">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center py-4">
                        <Mail className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                    <CardDescription>
                        We sent you a confirmation link. Click it to activate your account and get started.
                    </CardDescription>
                </CardHeader>
                <CardContent />
                <CardFooter className="flex-col text-center">
                    <Link className="w-full text-sm text-muted-foreground" href="/login">
                        Back to login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
