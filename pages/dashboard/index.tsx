import { Alert, Anchor, Box, Button, Group, PasswordInput, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useSetState } from "@mantine/hooks";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle } from "tabler-icons-react";
import Navbar from "../../components/Navbar";
import { signIn, useSession } from "next-auth/react"
import axios from "../../lib/axios";
import { updateSession } from "../../lib/sessionHelpers";

export default function Dashboard(){
    const {data: session, status} = useSession();
    if(status === 'loading') return null;
    if(status === 'authenticated') return (
        <>
            <Navbar/>
            {session.user.passwordWarning && (
                <Group position="center">
                    <Alert icon={<AlertCircle size={16} />} title="Uwaga!" color="red" radius="lg" mt={10} mx={10} sx={{
                        maxWidth: '400px',
                    }}>
                        Masz nadal ustawione domyślne hasło!
                        Zalecamy jak najszybszą zmianę.
                        <br/>
                        
                        <Link href='/dashboard/account/changepassword'>
                            <Anchor href='/dashboard/account/changepassword'>
                                Zmień hasło
                            </Anchor>
                        </Link>
                       
                    </Alert>
                </Group>
            
            )}
        </>
    )

    return(
        <>
            <Navbar/>
            <Heading/>
            <Group position="center">
                <Login/>
                <Register/>
            </Group>
            
        </>
    )
}

function Login(){
    const form = useForm({
        initialValues: {
            username: '',
            password: ''
        },
        validate: {
            username: (value) => (value.length<6 ? 'Nazwa użytkownika musi mieć minimum 6 znaków.' : null),
            password: (value) => (value.length<6 ? 'Hasło musi mieć minimum 6 znaków.' : null),
        }
    })

    const [loading, setLoading] = useState(false);
    const [error, setError] = useSetState({
        showError: false,
        msgError: ''
    })

    async function SendData(values: { username: string; password: string; }){
        setLoading(true);
        const res:any = await signIn('credentials', {redirect: false, ...values})
        
        if(res.error === 'Invalid username or password'){
            setError({
                showError: true,
                msgError: 'Niepoprawna nazwa użytkownika lub hasło. Spróbuj jeszcze raz.'
            })
        }
        if(res.error === 'Network Error'){
            setError({
                showError: true,
                msgError: 'Serwer nie odpowiada. Spróbuj ponownie później.'
            })
        }
        
        setLoading(false);
    }
    
    return(
        <Box sx={{maxWidth: 400, width: '100%'}} px={10} mt={20}>
            <form onSubmit={form.onSubmit((values) => SendData(values))}>
                {error.showError && (
                    <Alert my={10} icon={<AlertCircle size={16} />} title="Uwaga!" color="red" radius="xl" variant="filled" withCloseButton closeButtonLabel="Zamknij alert" onClose={() => {setError({showError:false})}}>
                        {error.msgError}
                    </Alert>
                )}
                <TextInput
                disabled={loading}
                label='Nazwa użytkownika'
                {...form.getInputProps('username')}/>

                <PasswordInput
                disabled={loading}
                mt='sm'
                label='Hasło'
                {...form.getInputProps('password')}/>

                <Group mt={25} position='center' grow>
                    <Button radius='xl' loading={loading} type='submit'>Zaloguj</Button>
                </Group>
            </form>
        </Box>
    )
}

function Register(){
    return(
        <Group direction='column' align='center' spacing='sm' mt={20} mx={10} sx={(theme) => ({
            maxWidth:330,
            backgroundColor:
                theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2],
            padding: 20,
            borderRadius: 20
        })}>
            <Title order={3} align='center'>Posiadasz firmę i chcesz skorzystać z <Text inherit component="span" variant='gradient' gradient={{from: 'red', to: 'blue'}}>bezpłatnych</Text> usług ProdBoost?</Title>
            <Link href='register'>
                <Button component="a" href="register">Zarejestruj się</Button>
            </Link>
        </Group>
    )
}

function Heading(){
    return(
        <>
            <Title order={1} align='center' mt={30} px={10} >
                <Text inherit component="span" variant='gradient' gradient={{ from: 'indigo', to: 'cyan', deg: 45 }}>ProdBoost</Text>
            </Title>
            <Title order={3} align='center' px={10}>Panel logowania</Title>
        </>
        
    )
}