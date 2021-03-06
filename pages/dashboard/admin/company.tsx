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
            minLength: [3, 'Nazwa firmy musi mie?? minimalnie 3 znaki.'],
            maxLength: [25, 'Nazwa firmy musi mie?? maksymalnie 25 znak??w.']
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
                <Title order={1} mb={10} align='center'>Zmie?? nazw?? firmy</Title>
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
                            <Button type="submit" loading={sendingData} disabled={anyError || !form.companyName.length} radius='xl' leftIcon={<Edit size={20}/>}>Zmie?? nazw?? firmy</Button>
                        </Group>
                    </form>
                </Group>

                <Title order={1} mt={30} mb={20} align='center'>Usu?? firm?? oraz ca???? zawarto????</Title>
                <Group grow={true} align='center' direction="column">
                    <Button radius='xl' color='red' leftIcon={<Trash size={20}/>} onClick={() => isModalForDeletingOpened[1](true)}>Usu?? firm??</Button>
                </Group>
            </Container>
        </>
    )
}

function ModalForDeletingCompany({openState, hashedPassword}: {openState: [boolean, Dispatch<SetStateAction<boolean>>], hashedPassword: string}){
    const [step, setStep] = useState(0);
    const [deletingProgress, setDeletingProgress] = useState(10)
    const [deletingLabel, setDeletingLabel] = useState('Usuwanie wszystkich zdj????...')

    const form = useForm({
        initialValues: {
            password: ''
        },
        validate: {
            password: (value) => compareSync(value, hashedPassword) ? null : 'B????dne has??o.'
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
        setDeletingLabel('Usuwanie wszystkich materia????w...');
        
        await axios.delete('/api/admin/deleteCompany/deleteAllMaterials');
        setDeletingProgress(30);
        setDeletingLabel('Usuwanie wszystkich komponent??w...');

        await axios.delete('/api/admin/deleteCompany/deleteAllComponents');
        setDeletingProgress(40);
        setDeletingLabel('Usuwanie wszystkich produkt??w...');

        await axios.delete('/api/admin/deleteCompany/deleteAllProducts');
        setDeletingProgress(50);
        setDeletingLabel('Usuwanie wszystkich opakowa??...');

        await axios.delete('/api/admin/deleteCompany/deleteAllPacking');
        setDeletingProgress(60);
        setDeletingLabel('Usuwanie wszystkich zam??wie??...');

        await axios.delete('/api/admin/deleteCompany/deleteAllOrders');
        setDeletingProgress(70);
        setDeletingLabel('Usuwanie wszystkich pracownik??w...');

        await axios.delete('/api/admin/deleteCompany/deleteAllUsers');
        setDeletingProgress(80);
        setDeletingLabel('Usuwanie firmy...');

        await axios.delete('/api/admin/deleteCompany/deleteCompany');
        setDeletingProgress(100);
        setDeletingLabel('Uda??o si??!');

        setTimeout(() => {
            setStep(2);
        }, 2000)
    }

    return(
        <Modal
            opened={openState[0]}
            onClose={() => openState[1](false)}
            centered
            title={<Text size="xl" weight={500}>Usu?? firm?? oraz ca???? zawarto????</Text>}
            closeOnClickOutside={false}
            withCloseButton={step === 0}
        >
            {step === 0 && (
            <Group direction="column" grow>
                <Text>Usuni??cie firmy oraz ca??ej zawarto??ci jest trwa??e i nieodwracalne.</Text>
                <Text>Aby potwierdzi??, wpisz swoje has??o.</Text>
                <PasswordInput label='Has??o' {...form.getInputProps('password')}/>
                <Button mt={20} color='red' leftIcon={<Trash size={20}/>} onClick={() => checkPassword()}>Usu??</Button>
            </Group>
            )}

            {step === 1 && (
            <Group direction="column" grow>
                <Text>Nie wy????czaj, ani nie od??wie??aj strony, dop??ki proces usuwania nie zostanie zako??czony.</Text>
                <Progress mt={20} value={deletingProgress} animate />
                <Text align="center">{deletingLabel}</Text>
            </Group>
            )}

            {step === 2 && (
            <Group direction="column" grow>
                <Text>Dzi??kujemy za skorzystanie z us??ug ProdBoost.</Text>
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