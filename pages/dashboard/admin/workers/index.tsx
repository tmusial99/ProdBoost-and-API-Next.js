import { Avatar, Button, Checkbox, Container, Group, Modal, Text, TextInput, Title } from "@mantine/core"
import { useSetState } from "@mantine/hooks";
import { AxiosError } from "axios";
import { ObjectId } from "mongodb";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { ArrowBarRight, UserPlus } from "tabler-icons-react";
import Head from "../../../../components/Head";
import Navbar from "../../../../components/Navbar"
import Navigation from "../../../../components/Navigation";
import axios from "../../../../lib/axios";
import getDatabase from "../../../../lib/getDatabase";
import { isItName, transofrmNameOnBlur } from "../../../../lib/inputHelpers";
import useFormValidation from "../../../../lib/useFormValidation";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session = await getSession(ctx)
    if(session?.user.role !== 'CompanyOwner'){
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        }
    }

    const {client, db} = await getDatabase()
    const allWorkersFromSSR = await db.collection('users').find({companyId: new ObjectId(session.user.companyId), role: 'Worker'}).project({_id: {$toString: '$_id'}, firstName: 1, surname: 1, image_url: 1}).sort({_id: -1}).toArray();
    await client.close();

    return {props: {allWorkersFromSSR}}
}

export default function Page({allWorkersFromSSR}: {allWorkersFromSSR: {_id: string, image_url?: string, firstName: string, surname: string}[]}){
    const items = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pracownicy', href: '' }
    ]

    const [form, setForm] = useSetState({
        firstName: '',
        surname: ''
    })
    const [permissions, setPermissions] = useState<string[]>([])
    const {errors, anyError, setErrors} = useFormValidation(form, {
        firstName:{
            required: true,
            minLength: [2, 'Imię musi mieć minimalnie 2 znaki.'],
            maxLength: [25, 'Imię musi mieć maksymalnie 25 znaków.']
        },
        surname:{
            required: true,
            minLength: [2, 'Nazwisko musi mieć minimalnie 2 znaki.'],
            maxLength: [25, 'Nazwisko musi mieć maksymalnie 25 znaków.']
        }
    })


    const [sendingData, setSendingData] = useState(false);
    const [creatingWorker, setCreatingWorker] = useState(false);
    const sendData = async (e: any) => {
        e.preventDefault();

        setSendingData(true);
        try{
            const newWorker = await axios.post('/api/admin/addWorker', {...form, permissions});
            setAllWorkers((curr) => ([newWorker.data, ...curr]))
            console.log(newWorker);
            setSendingData(false);
            setForm({firstName:'', surname:''});
            setPermissions([]);
            setCreatingWorker(false);
        }
        catch(e){
            const error = e as AxiosError;
            console.log(error);
            setSendingData(false);
        }
    }

    const [allWorkers, setAllWorkers] = useState<{_id: string, image_url?: string, firstName: string, surname: string}[]>(allWorkersFromSSR)

    return(
        <>
            <Head title='ProdBoost - Pracownicy'/>
            <Navbar/>
            <Modal
                opened={creatingWorker}
                onClose={() => setCreatingWorker(false)}
                closeOnClickOutside={false}
                withCloseButton={!sendingData}
                title='Dodaj pracownika'
                centered={true}
            >
                <form>
                    <Group direction="column">
                        <TextInput
                            description='Imię'
                            value={form.firstName}
                            onChange={(e) => {
                                const value = e.target.value
                                if(!isItName(value) && value.length !== 0) return;

                                setForm({firstName: value})
                            }}
                            onBlur={(e) => {
                                const value = transofrmNameOnBlur(e.target.value);
                                setForm({firstName: value})
                            }}
                            error={errors.firstName}
                            style={{width:'100%'}}
                        />
                        <TextInput
                            description='Nazwisko'
                            value={form.surname}
                            onChange={(e) => {
                                const value = e.target.value
                                if(!isItName(value) && value.length !== 0) return;

                                setForm({surname: value})
                            }}
                            onBlur={(e) => {
                                const value = transofrmNameOnBlur(e.target.value);
                                setForm({surname: value})
                            }}
                            error={errors.surname}
                            style={{width:'100%'}}
                        />
                    </Group>
                    <Text align="center" mt={20} mb={5}>Uprawnienia</Text>
                    <Group direction="column">
                        <Checkbox label="Materiały" radius="xl" size="md" checked={permissions.includes('materials')} onChange={(e) => {
                            e.target.checked ? setPermissions((curr) => ([...curr, 'materials'])) : setPermissions((curr) => (curr.filter(x => x !== 'materials')))
                        }}/>
                        <Checkbox label="Komponenty" radius="xl" size="md" checked={permissions.includes('components')} onChange={(e) => {
                            e.target.checked ? setPermissions((curr) => ([...curr, 'components'])) : setPermissions((curr) => (curr.filter(x => x !== 'components')))
                        }}/>
                        <Checkbox label="Produkty" radius="xl" size="md" checked={permissions.includes('products')} onChange={(e) => {
                            e.target.checked ? setPermissions((curr) => ([...curr, 'products'])) : setPermissions((curr) => (curr.filter(x => x !== 'products')))
                        }}/>
                        <Checkbox label="Pakowanie" radius="xl" size="md" checked={permissions.includes('packing')} onChange={(e) => {
                            e.target.checked ? setPermissions((curr) => ([...curr, 'packing'])) : setPermissions((curr) => (curr.filter(x => x !== 'packing')))
                        }}/>
                        <Checkbox label="Zamówienia" radius="xl" size="md" checked={permissions.includes('orders')} onChange={(e) => {
                            e.target.checked ? setPermissions((curr) => ([...curr, 'orders'])) : setPermissions((curr) => (curr.filter(x => x !== 'orders')))
                        }}/>
                    </Group>
                    <Group grow mt={30}>
                        <Button leftIcon={<UserPlus/>} loading={sendingData} disabled={!permissions.length || anyError} onClick={(e: any) => sendData(e)}>Dodaj pracownika</Button>
                    </Group>
                </form>
            </Modal>
            <Container>
                <Navigation items={items}/>
                <Title order={1} mb={20} align='center'>Pracownicy</Title>
                <Group grow={true} align='center' direction="column">
                    <Button radius='xl' onClick={() => setCreatingWorker(true)}>Dodaj pracownika</Button>
                </Group>
                <Group direction="column" position="center" mt={30}>
                    {allWorkers?.map(worker => (
                        <Group key={worker._id} noWrap sx={(theme) => ({
                            padding: '10px 30px 10px 20px',
                            width: '100%',
                            maxWidth: '500px',
                            borderRadius: '100px',
                            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]
                        })}>
                            <Avatar radius='xl' size="lg" src={worker.image_url}/>
                            <Text size="lg" weight='bold' sx={{textOverflow: "ellipsis", whiteSpace: 'nowrap', overflow: 'hidden'}}>{`${worker.firstName} ${worker.surname}`}</Text>
                            <Link href={`workers/${worker._id}`}>
                                <Button px={10} variant="light" ml='auto' component="a" href={`workers/${worker._id}`}><ArrowBarRight /></Button>
                            </Link> 
                        </Group>
                    ))}
                </Group>
            </Container>
        </>
    )
}

