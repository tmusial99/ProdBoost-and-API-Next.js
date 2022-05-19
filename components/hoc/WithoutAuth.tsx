import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function WithoutAuth({children}:any){
    const {data: session, status} = useSession()

    if(status === 'loading') return null; 
    if(status === 'unauthenticated') return children
    if(status === 'authenticated') return <RouterComponent/>
}

function RouterComponent(){
    const router = useRouter()
    useEffect(() => {
        router.replace('/dashboard')
    })
    return null
}