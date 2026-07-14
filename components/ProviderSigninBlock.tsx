import { FaGoogle } from 'react-icons/fa'
import { signInWithGoogle } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'

export default function ProviderSigninBlock() {
    return (
        <form action={signInWithGoogle}>
            <Button variant="outline" aria-label="Sign in with Google" type="submit" className="w-full gap-2">
                <FaGoogle />
                Continue with Google
            </Button>
        </form>
    )
}
