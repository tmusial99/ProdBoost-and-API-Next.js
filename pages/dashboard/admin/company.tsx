import { Button, Container, Group, Modal, PasswordInput, Progress, Text, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form";
import { useInterval, useSetState } from "@mantine/hooks";
import { AxiosError } from "axios";
import { compareSync } from "bcryptjs";
import { ObjectId } from "mongodb";
import { GetServerSideProps } from "next";
import { getSession, signOut } from "next-auth/react";
import { Dispatch, FormEvent, SetStateAction, useEffect, useState } from "react";
import { Edit, Trash } from "tabler-icons-react";
import Head from "../../../components/Head";
import Navbar from "../../../components/Navbar"
import Navigation from "../../../components/Navigation";
import axios from "../../../lib/axios";
import getDatabase from "../../../lib/getDatabase";
import { updateSession } from "../../../lib/sessionHelpers";
import useFormValidation from "../../../lib/useFormValidation";

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
    if(session?.user.role !== 'CompanyOwner'){
        return {
            redirect: {
                destination: '/unauthorized',
                permanent: false
            }
        }
    }

    const {db, client} = await getDatabase()
    const user = await db.collection('users').findOne({_id: new ObjectId(session.user._id)}, {projection: {_id: 0, hashedPassword: 1}});
    await client.close()

    return {props: {hashedPassword: user?.hashedPassword}}
}

const items = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Ustawienia firmy', href: '' }
]

export default function Page({hashedPassword}: {hashedPassword: string}){
    const [form, setForm] = useSetState({
        companyName: ''
    })
    const {errors, anyError, setErrors} = useFormValidation(form, {
        companyName:{
            minLength: [3, 'Nazwa firmy musi mieć minimalnie 3 znaki.'],
            maxLength: [25, 'Nazwa firmy musi mieć maksymalnie 25 znaków.']
        }
    })

    const [sendingData, setSendingData] = useState(false);
    const sendData = async (e: FormEvent) => {
        e.preventDefault();

        setSendingData(true);
        try{
            await axios.post('/api/admin/changeCompanyName', {companyName: form.companyName});
            await updateSession();
        }
        catch(e){
            const error = e as AxiosError
            console.log(error)
        }
        setSendingData(false);
    }


    const isModalForDeletingOpened = useState(false);

    return(
        <>
            <Head title='ProdBoost - Ustawienia firmy'/>
            <Navbar/>
            <ModalForDeletingCompany openState={isModalForDeletingOpened} hashedPassword={hashedPassword}/>
            <Container>
                <Navigation items={items}/>
                <Title order={1} mb={10} align='center'>Zmień nazwę firmy</Title>
                <Group grow={true} align='center' direction="column">
                    <form style={{maxWidth: '350px', width:'100%'}} onSubmit={(e) => sendData(e)}>
                        <TextInput
                            mb={30}
                            error={errors.companyName}
                            label='Nazwa firmy'
                            value={form.companyName}
                            onChange={(e) => setForm({companyName: e.target.value})}
                        />
                        <Group grow>
                            <Button type="submit" loading={sendingData} disabled={anyError || !form.companyName.length} radius='xl' leftIcon={<Edit size={20}/>}>Zmień nazwę firmy</Button>
                        </Group>
                    </form>
                </Group>

                <Title order={1} mt={30} mb={20} align='center'>Usuń firmę oraz całą zawartość</Title>
                <Group grow={true} align='center' direction="column">
                    <Button radius='xl' color='red' leftIcon={<Trash size={20}/>} onClick={() => isModalForDeletingOpened[1](true)}>Usuń firmę</Button>
                </Group>
            </Container>
        </>
    )
}

function ModalForDeletingCompany({openState, hashedPassword}: {openState: [boolean, Dispatch<SetStateAction<boolean>>], hashedPassword: string}){
    const [step, setStep] = useState(0);
    const [deletingProgress, setDeletingProgress] = useState(10)
    const [deletingLabel, setDeletingLabel] = useState('Usuwanie wszystkich zdjęć...')

    const form = useForm({
        initialValues: {
            password: ''
        },
        validate: {
            password: (value) => compareSync(value, hashedPassword) ? null : 'Błędne hasło.'
        }
    })

    const checkPassword = () => {
        const validateResult = form.validate();
        if(validateResult.hasErrors) return;

        setStep(1);
        deleteCompany();
    }

    const deleteCompany = async () => {
        await axios.delete('/api/admin/deleteCompany/deleteAllPhotos');
        setDeletingProgress(20);
        setDeletingLabel('Usuwanie wszystkich materiałów...');
        
        await axios.delete('/api/admin/deleteCompany/deleteAllMaterials');
        setDeletingProgress(30);
        setDeletingLabel('Usuwanie wszystkich komponentów...');

        await axios.delete('/api/admin/deleteCompany/deleteAllComponents');
        setDeletingProgress(40);
        setDeletingLabel('Usuwanie wszystkich produktów...');

        await axios.delete('/api/admin/deleteCompany/deleteAllProducts');
        setDeletingProgress(50);
        setDeletingLabel('Usuwanie wszystkich opakowań...');

        await axios.delete('/api/admin/deleteCompany/deleteAllPacking');
        setDeletingProgress(60);
        setDeletingLabel('Usuwanie wszystkich zamówień...');

        await axios.delete('/api/admin/deleteCompany/deleteAllOrders');
        setDeletingProgress(70);
        setDeletingLabel('Usuwanie wszystkich pracowników...');

        await axios.delete('/api/admin/deleteCompany/deleteAllUsers');
        setDeletingProgress(80);
        setDeletingLabel('Usuwanie firmy...');

        await axios.delete('/api/admin/deleteCompany/deleteCompany');
        setDeletingProgress(100);
        setDeletingLabel('Udało się!');

        setTimeout(() => {
            setStep(2);
        }, 2000)
    }

    return(
        <Modal
            opened={openState[0]}
            onClose={() => openState[1](false)}
            centered
            title={<Text size="xl" weight={500}>Usuń firmę oraz całą zawartość</Text>}
            closeOnClickOutside={false}
            withCloseButton={step === 0}
        >
            {step === 0 && (
            <Group direction="column" grow>
                <Text>Usunięcie firmy oraz całej zawartości jest trwałe i nieodwracalne.</Text>
                <Text>Aby potwierdzić, wpisz swoje hasło.</Text>
                <PasswordInput label='Hasło' {...form.getInputProps('password')}/>
                <Button mt={20} color='red' leftIcon={<Trash size={20}/>} onClick={() => checkPassword()}>Usuń</Button>
            </Group>
            )}

            {step === 1 && (
            <Group direction="column" grow>
                <Text>Nie wyłączaj, ani nie odświeżaj strony, dopóki proces usuwania nie zostanie zakończony.</Text>
                <Progress mt={20} value={deletingProgress} animate />
                <Text align="center">{deletingLabel}</Text>
            </Group>
            )}

            {step === 2 && (
            <Group direction="column" grow>
                <Text>Dziękujemy za skorzystanie z usług ProdBoost.</Text>
                <Timer/>
            </Group>
            )}
        </Modal>
    )
}

function Timer(){
    const [seconds, setSeconds] = useState(3)
    const interval = useInterval(() => setSeconds((s) => s - 1), 1000)

    useEffect(() => {
        interval.start()
        return interval.stop
    }, [])

    useEffect(() => {
        if(seconds === 0){
            interval.stop()
            signOut({callbackUrl: `${process.env.AXIOS_URL}/dashboard`})
        }
    }, [seconds])

    return (
        <Text align="center" color='dimmed'>Wylogowanie za {seconds}...</Text>
    )
}