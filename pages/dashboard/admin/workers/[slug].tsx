import { Avatar, Button, Center, Checkbox, Container, Group, Modal, Paper, Text, TextInput } from "@mantine/core"
import { showNotification } from "@mantine/notifications"
import { CheckIcon } from "@modulz/radix-icons"
import { AxiosError } from "axios"
import { ObjectId } from "mongodb"
import { GetServerSideProps } from "next"
import { getSession } from "next-auth/react"
import { useRouter } from "next/router"
import { useState } from "react"
import { Trash, Upload, X } from "tabler-icons-react"
import Head from "../../../../components/Head"
import Navbar from "../../../../components/Navbar"
import Navigation from "../../../../components/Navigation"
import axios from "../../../../lib/axios"
import getDatabase from "../../../../lib/getDatabase"

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

    const {client, db} = await getDatabase()
    const queryProjection = {
        _id: {$toString: '$_id'},
        username: 1,
        initialPassword: 1,
        firstName: 1,
        surname: 1,
        permissions: 1,
        image_url: 1
    }
    const worker = await db.collection('users').findOne({_id: new ObjectId(ctx.query.slug as string), companyId: new ObjectId(session.user.companyId), role: 'Worker'}, {projection: queryProjection});
    await client.close();

    return {props: {worker}}
}



export default function Page({worker}: {worker: {_id:string, username:string, initialPassword?:string, firstName:string, surname:string, permissions:string[], image_url?:string}}){
    const router = useRouter();
    const items = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pracownicy', href: '/dashboard/admin/workers' },
        { title: `${worker.firstName} ${worker.surname}`, href: `/dashboard/admin/workers/${router.query.slug}`}
    ]
    const [permissions, setPermissions] = useState(worker.permissions);
    const [changingPermissions, setChangingPermissions] = useState(false);
    const [permissionsSaved, setPermissionsSaved] = useState(false);
    const changePermissions = async () => {
        setChangingPermissions(true);
        try{
            const res = await axios.post('/api/admin/changeWorkerPermissions', {
                permissions: permissions,
                workerId: worker._id
            })
            console.log(res.data)
            setPermissionsSaved(true);
            worker.permissions = res.data.permissions;
            showNotification({
                title: 'Udało się!',
                message: 'Poprawnie zapisano uprawnienia pracownika.',
                icon: <CheckIcon/>,
                autoClose: 8000,
                radius: 'lg',
                color: 'green'
            })
        }
        catch(e){
            const error = e as AxiosError;
            console.log(error);
        }
        setChangingPermissions(false);
    }


    const [deletingWorker, setDeletingWorker] = useState(false);
    const [sendingDataDeletingWorker, setSendingDataDeletingWorker] = useState(false);
    const deleteWorker = async () => {
        setSendingDataDeletingWorker(true);
        try{
            const res = await axios.post('/api/admin/deleteWorker', {_id: worker._id});
            router.replace('/dashboard/admin/workers');
        }
        catch(e){
            const error = e as AxiosError;
            setSendingDataDeletingWorker(false);
        }
    }
    return(
        <>
            <Head title={`ProdBoost - ${worker.firstName} ${worker.surname}`}/>
            <Navbar/>
            <Modal
                opened={deletingWorker}
                centered
                onClose={() => setDeletingWorker(false)}
                withCloseButton={!sendingDataDeletingWorker}
                closeOnClickOutside={false}
                title={<Text size='lg'>Czy na pewno chcesz usunąć konto pracownika <Text size='lg' weight='bolder' component="span">{`${worker.firstName} ${worker.surname}`}</Text>?</Text>}
            >
                <Text color='dimmed'>Konto zostanie nieodwracalnie usunięte.</Text>
                <Text color='dimmed'>Chcesz kontynować?</Text>
                <Group mt={20} position="center" spacing='xl'>
                    <Button disabled={sendingDataDeletingWorker} leftIcon={<X/>} color='red' onClick={() => setDeletingWorker(false)}>Nie</Button>
                    <Button loading={sendingDataDeletingWorker} leftIcon={<Trash/>} color='green' variant='outline' onClick={() => deleteWorker()}>Tak</Button>
                </Group>
            </Modal>
            <Container>
                <Navigation items={items}/>
                <Group direction='column' position="center" mt={30}>
                    <Avatar size={150} radius={100} src={worker.image_url}/>
                    <Text size='lg' weight='bold' align="center">{`${worker.firstName} ${worker.surname}`}</Text>
                </Group>
                <Group position="center" mt={20} mx='auto' sx={{maxWidth: '400px'}}>
                    <TextInput label='Nazwa użytkownika' value={worker.username} readOnly sx={{flexGrow: 1}}/>
                    <TextInput label='Hasło' value={worker.initialPassword ? worker.initialPassword : 'Hasło zostało zmienione.'} readOnly sx={{flexGrow: 1}}/>
                </Group>
                <Center>
                    <Paper mt={20} shadow="lg" radius="xl" withBorder style={{flexGrow:1, maxWidth:400}} sx={(theme) => ({
                        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : "white"
                    })}>
                        <Group direction="column" position="center" mt={15} mb={20}>
                            <Text weight='bold' size='lg'>Uprawnienia</Text>
                            <Group direction='column' >
                                <Checkbox label="Materiały" radius="xl" size="md" checked={permissions.includes('materials')} disabled={changingPermissions} onChange={(e) => {
                                    setPermissionsSaved(false);
                                    e.target.checked ? setPermissions((curr) => ([...curr, 'materials'])) : setPermissions((curr) => (curr.filter(x => x !== 'materials')))
                                    }}/>
                                <Checkbox label="Komponenty" radius="xl" size="md" checked={permissions.includes('components')} disabled={changingPermissions} onChange={(e) => {
                                    setPermissionsSaved(false);
                                    e.target.checked ? setPermissions((curr) => ([...curr, 'components'])) : setPermissions((curr) => (curr.filter(x => x !== 'components')))
                                }}/>
                                <Checkbox label="Produkty" radius="xl" size="md" checked={permissions.includes('products')} disabled={changingPermissions} onChange={(e) => {
                                    setPermissionsSaved(false);
                                    e.target.checked ? setPermissions((curr) => ([...curr, 'products'])) : setPermissions((curr) => (curr.filter(x => x !== 'products')))
                                }}/>
                                <Checkbox label="Pakowanie" radius="xl" size="md" checked={permissions.includes('packing')} disabled={changingPermissions} onChange={(e) => {
                                    setPermissionsSaved(false);
                                    e.target.checked ? setPermissions((curr) => ([...curr, 'packing'])) : setPermissions((curr) => (curr.filter(x => x !== 'packing')))
                                }}/>
                                <Checkbox label="Zamówienia" radius="xl" size="md" checked={permissions.includes('orders')} disabled={changingPermissions} onChange={(e) => {
                                    setPermissionsSaved(false);
                                    e.target.checked ? setPermissions((curr) => ([...curr, 'orders'])) : setPermissions((curr) => (curr.filter(x => x !== 'orders')))
                                }}/>
                            </Group>
                        </Group>
                    </Paper>
                </Center>
                <Group position='center' mt={20} mx='auto' sx={{maxWidth: 400}}>
                    <Button sx={{flexGrow: 1}} leftIcon={<Upload size={18}/>} onClick={() => changePermissions()} loading={changingPermissions} disabled={worker.permissions.sort().toString() === permissions.sort().toString() || permissions.length === 0 || permissionsSaved}>Zapisz zmiany</Button>
                    <Button sx={{flexGrow: 1}} variant='outline' color='red' leftIcon={<Trash size={18}/>} onClick={() => setDeletingWorker(true)}>Usuń pracownika</Button>
                </Group>
            </Container>
        </>
    )
}