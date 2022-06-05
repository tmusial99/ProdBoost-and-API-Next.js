import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

type Props={
    children:any,
    withRole?: 'CompanyOwner',
    withPermission?: 'materials' | 'components' | 'products' | 'packing' | 'orders'
}

export default function WithAuth({children, withRole, withPermission}:Props){
    const {data: session, status} = useSession()

    if(status === 'loading') return null; 
    if(status === 'unauthenticated') return <RouterComponent/>

    if(!withRole && !withPermission){
        if(status === 'authenticated') return children
    }

    if(withRole === 'CompanyOwner'){
        if(session?.user.role === 'CompanyOwner') return children
        else return <RouterComponent/>
    }

    function checkUserPermissions(role: string){
        if(session?.user.permissions.includes(role)) return children
        else return <RouterComponent/>
    }
    if(withPermission){
        switch(withPermission){
            case 'materials':
                return checkUserPermissions('materials');
            case 'components':
                return checkUserPermissions('components');
            case 'products':
                return checkUserPermissions('products');
            case 'packing':
                return checkUserPermissions('packing');
            case 'orders':
                return checkUserPermissions('orders');
        }
    }
    
}

function RouterComponent(){
    const router = useRouter()
    useEffect(() => {
        router.replace('/dashboard')
    })
    return null
}