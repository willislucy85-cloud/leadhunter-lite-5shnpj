import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import SignupForm from "@/components/SignupForm"
import ProviderSigninBlock from "@/components/ProviderSigninBlock"

export default function Signup() {
    return (
        <div className="flex items-center justify-center bg-muted min-h-screen">

            <Card className="w-[350px] mx-auto">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center py-2">
                        <Link href='/' className="font-extrabold text-xl tracking-tight">
                            LeadHunter <span className="text-primary">Lite</span>
                        </Link>
                    </div>

                    <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
                    <CardDescription>Start finding and closing more leads</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <SignupForm />
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>
                    <ProviderSigninBlock />
                </CardContent>
                <CardFooter className="flex-col text-center">
                    <Link className="w-full text-sm text-muted-foreground" href="/login">
                        Have an account? Login
                    </Link>
                </CardFooter>
            </Card>
        </div >

    )
}