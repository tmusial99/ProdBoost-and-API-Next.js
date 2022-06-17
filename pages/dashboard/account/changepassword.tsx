import { Alert, Button, Container, Group, LoadingOverlay, Modal, PasswordInput, Text, Title } from "@mantine/core"
import { useSetState } from "@mantine/hooks";
import { AxiosError } from "axios";
import { GetServerSideProps } from "next";
import { getSession, signOut } from "next-auth/react";
import { FormEvent, useState } from "react";
import { AlertCircle, Key, Login } from "tabler-icons-react";
import Head from "../../../components/Head";
import Navbar from "../../../components/Navbar"
import Navigation from "../../../components/Navigation";
import axios from "../../../lib/axios";
import useFormValidation from "../../../lib/useFormValidation";
import { PasswordStrength } from "../../register";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session = await getSession(ctx)
    if(!session){
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        }
    }
    
    return {props: {}}
}

const items = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Zmień hasło', href: '' }
]

export default function Page(){
    const [form, setForm] = useSetState({
        actualPassword: '',
        password: '',
        confirmPassword: ''
    })
    const {errors, anyError, setErrors} = useFormValidation(form, {
        actualPassword:{
            required: true,
            minLength: [6, 'Hasło musi mieć minimalnie 6 znaków.'],
            maxLength: [25, 'Hasło musi mieć maksymalnie 25 znaków.']
        },
        password:{
            required: true
        },
        confirmPassword:{
            required: true,
            equals: [form.password, 'Hasła się nie zgadzają.']
        }
    })
    const [showAlert, setShowAlert] = useSetState({
        show: false,
        msg: ''
    });
    const [sendingData, setSendingData] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);
    const sendData = async (e: FormEvent) => {
        e.preventDefault();
        if(form.actualPassword === form.password){
            setShowAlert({show: true, msg: 'Nowe hasło musi być inne od obecnego. Spróbuj jeszcze raz.'});
            return;
        }

        setSendingData(true);
        try{
            const res = await axios.post('/api/account/changePassword', {actualPassword: form.actualPassword, password:form.password});
            setPasswordChanged(true);
        }
        catch(e){
            const error = e as AxiosError
            console.dir(error)
            switch(error.response?.data){
                case 'invalid data':
                    setShowAlert({show: true, msg: 'Podano nieprawidłowe dane. Spróbuj jeszcze raz.'});
                    break;
                case 'unauthorized':
                    setShowAlert({show: true, msg: 'Wystąpił problem z kontem. Zaloguj się ponownie.'});
                    break;
                case 'invalid password':
                    setShowAlert({show: true, msg: 'Podano nieprawidłowe obecne hasło. Spróbuj jeszcze raz.'});
                    break;
            }
        }
        setSendingData(false);
    }
    return(
        <>
            <Head title='ProdBoost - Zmień hasło'/>
            <Navbar/>
            <Container>
                <LoadingOverlay visible={sendingData} sx={{position:'fixed'}}/>
                <ModalAfterSuccess opened={passwordChanged}/>
                <Navigation items={items}/>
                <Title order={1} mb={10} align='center'>Zmień hasło</Title>
                <Group grow={true} align='center' direction="column">
                    {showAlert.show && (
                        <Alert icon={<AlertCircle size={16} />} title="Błąd!" color="red" withCloseButton variant="outline" onClose={() => setShowAlert({show:false})}>
                            {showAlert.msg}
                        </Alert>
                    )}
                    <form style={{maxWidth: '350px', width:'100%'}} onSubmit={(e) => sendData(e)}>
                        <PasswordInput
                            mb={10}
                            error={errors.actualPassword}
                            label='Obecne hasło'
                            value={form.actualPassword}
                            onChange={(e) => setForm({actualPassword: e.target.value})}
                        />
                        <PasswordStrength label='Nowe hasło' form={form} setForm={setForm} errors={errors} setErrors={setErrors}/>
                        <PasswordInput
                            mt={5}
                            mb={30}
                            error={errors.confirmPassword}
                            label='Powtórz nowe hasło'
                            value={form.confirmPassword}
                            onChange={(e) => setForm({confirmPassword: e.target.value})}
                        />
                        <Group grow>
                            <Button type="submit" disabled={anyError || sendingData || !form.password.length} radius='xl' leftIcon={<Key size={20}/>}>Zmień hasło</Button>
                        </Group>
                    </form>
                </Group>
                
            </Container>
        </>
    )
}

function ModalAfterSuccess({opened}: {opened:boolean}){
    return(
        <Modal 
            opened={opened}
            onClose={() => {}}
            withCloseButton={false}
            closeOnClickOutside={false}
            closeOnEscape={false}
            radius='lg'
            centered={true}
        >
            <Title order={2} align='center'>Udało się! 🎉</Title>
            <Title order={4} align='center'>Teraz Twoje konto będzie bezpieczniejsze.</Title>
            <Text mt={10} align="center">Użyj nowego hasła, aby zalogować się ponownie.</Text>
            <Group position="center" mt={10}>
                <Button leftIcon={<Login/>} onClick={() => {signOut({callbackUrl: `${process.env.AXIOS_URL}/dashboard`})}}>Zaloguj się ponownie</Button>
            </Group>
        </Modal>
    )
}