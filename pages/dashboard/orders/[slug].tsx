import { Box, Button, Center, Container, Divider, Group, LoadingOverlay, Modal, ScrollArea, Select, Table, Text, TextInput } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { CheckIcon } from "@modulz/radix-icons";
import { AxiosError } from "axios";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { ObjectId } from "mongodb";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Trash, X } from "tabler-icons-react";
import { IOrder } from "../../../atoms/orders";
import Head from "../../../components/Head";
import Navbar from "../../../components/Navbar";
import Navigation from "../../../components/Navigation";
import axios from "../../../lib/axios";
import getDatabase from "../../../lib/getDatabase";

//#region atoms
const orderAtom = atom<IOrder & {_id: string} | null>(null)
//#endregion atoms

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session = await getSession(ctx)
    if(!session?.user.permissions.includes('orders')){
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        }
    }

    const {client, db} = await getDatabase()
    const order = await db.collection('orders').findOne({companyId: new ObjectId(session.user.companyId), orderId: parseInt(ctx.query.slug as string)});
    if(!order){
        await client.close()
        return { notFound: true }
    }

    await client.close();

    return {props: {orderFromDb: JSON.parse(JSON.stringify(order))}}
}

export default function Page({orderFromDb}: {orderFromDb: IOrder & {_id: string}}){
    const router = useRouter()
    const items = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Zamówienia', href: '/dashboard/orders' },
        { title: `Zamówienie ${orderFromDb.orderId}`, href: `/dashboard/orders/${router.query.slug}`}
    ]

    const [order, setOrder] = useAtom(orderAtom)

    useEffect(() => {
        setOrder(orderFromDb)
    }, [])

    const isModalForDeletingOpened = useState(false)
    return(
        <>
            <Head title={`ProdBoost - Zamówienie ${orderFromDb.orderId}`}/>
            <Navbar/>
            <ModalForDeleting openState={isModalForDeletingOpened}/>
            <Container>
                <Navigation items={items}/>
                <ScrollArea type='always' mt={10}>
                    <Table fontSize='lg' sx={{minWidth: '600px'}}>
                        <thead>
                            <tr>
                                <th><Text>ID</Text></th>
                                <th><Text>Nazwa</Text></th>
                                <th><Text>Ilość</Text></th>
                                <th><Text>Cena netto</Text></th>
                                <th><Text>Cena brutto</Text></th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                            order && order.basket?.map((product) => (
                                <tr key={product.productId}>
                                    <td>{product.productId}</td>
                                    <td>{product.name}</td>
                                    <td>{product.quantity}</td>
                                    <td>{product.totalNetto ? `${product.totalNetto.toFixed(2).toString().replace(/[.]/g, ',')} zł` : '0,00zł'}</td>
                                    <td>{product.totalBrutto ? `${product.totalBrutto.toFixed(2).toString().replace(/[.]/g, ',')} zł` : '0,00zł'}</td>
                                </tr>
                            ))
                            }
                            <tr>
                                <td>Dostawa</td>
                                <td>{order?.delivery.label}</td>
                                <td>-</td>
                                <td>{order?.delivery.netto ? `${order.delivery.netto.toFixed(2)} zł`: '0,00zł'}</td>
                                <td>{order?.delivery.brutto ? `${order.delivery.brutto.toFixed(2)} zł` : '0,00zł'}</td>
                            </tr>
                            <tr style={{fontWeight: 'bold'}}>
                                <td></td>
                                <td>Podsumowanie</td>
                                <td></td>
                                <td>{order?.totalNetto ? `${order.totalNetto.toFixed(2).toString().replace(/[.]/g, ',')} zł` : '0,00zł'}</td>
                                <td>{order?.totalBrutto ? `${order.totalBrutto.toFixed(2).toString().replace(/[.]/g, ',')} zł` : '0,00zł'}</td>
                            </tr>
                        </tbody>
                    </Table>
                </ScrollArea>
                <Form/>
                <Group sx={{maxWidth: '600px'}} mx='auto' position='center' grow>
                    <Button color='red' leftIcon={<Trash size={20}/>} onClick={() => isModalForDeletingOpened[1](true)}>Usuń zamówienie</Button>
                </Group>
            </Container>
        </>
    )
}

function ModalForDeleting({openState}: {openState: [boolean, Dispatch<SetStateAction<boolean>>]}){
    const router = useRouter();
    const order = useAtomValue(orderAtom);
    const [sendingData, setSendingData] = useState(false)

    const deleteOrder = async () => {
        setSendingData(true);
        try{
            await axios.post('/api/orders/delete', {_id: order?._id});
            router.replace('/dashboard/orders');
        }
        catch(e){
            const error = e as AxiosError;
            console.log(error)
            setSendingData(false);
        }
    }
    return (
        <Modal
            opened={openState[0]}
            centered
            onClose={() => openState[1](false)}
            withCloseButton={!sendingData}
            closeOnClickOutside={false}
            title={<Text size='lg'>Czy na pewno chcesz usunąć to zamówienie?</Text>}
        >
            <Text color='dimmed'>Zamówienie zostanie nieodwracalnie usunięte.</Text>
            <Text color='dimmed'>Chcesz kontynować?</Text>
            <Group mt={20} position="center" spacing='xl'>
                <Button disabled={sendingData} leftIcon={<X/>} color='red' onClick={() => openState[1](false)}>Nie</Button>
                <Button loading={sendingData} leftIcon={<Trash/>} color='green' variant='outline' onClick={() => deleteOrder()}>Tak</Button>
            </Group>
        </Modal>
    )
}

const deliveryStatuses = [
    {value: '1', label: 'Zamówienie złożone'},
    {value: '2', label: 'Zamówienie potwierdzone'},
    {value: '3', label: 'Zamówienie przyjęte do realizacji'},
    {value: '4', label: 'Zamówienie wysłane'},
    {value: '5', label: 'Zamówienie zrealizowane'},
    {value: '6', label: 'Zamówienie anulowane'}
]

function Form(){
    const order = useAtomValue(orderAtom);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [sendingData, setSendingData] = useState(false);

    useEffect(() => {
        setSelectedStatus(order?.status.toString() as string)
    }, [order])

    const saveOrderStatus = async () => {
        setSendingData(true);
        try{
            await axios.put('/api/orders/changeStatus', {_id: order?._id, status: parseInt(selectedStatus)});
            showNotification({
                title: 'Udało się!',
                message: 'Poprawnie zapisano status zamówienia.',
                icon: <CheckIcon/>,
                autoClose: 8000,
                radius: 'lg',
                color: 'green'
            });
            setSendingData(false);
        }
        catch(e){
            const error = e as AxiosError
            console.error(error)
            setSendingData(false);
        }
    }
    

    return(
        <>
            <LoadingOverlay visible={sendingData}/>
            <Group direction="column" grow mx='auto' mt={20} spacing={0} sx={{maxWidth: '600px'}}>
                <Group grow noWrap align='flex-end'>
                    <Select sx={{maxWidth: '100%'}} label='Status zamówienia' data={deliveryStatuses} value={selectedStatus as string} onChange={(value) => setSelectedStatus(value as string)}/>
                    <Button sx={{maxWidth: '80px'}} onClick={saveOrderStatus}>Zapisz</Button>
                </Group>
                <Divider size='md' label='Dane kontaktowe' mt={30}/>
                <Group grow mb={5}>
                    <TextInput label='Imię' value={order?.form.firstName ? order.form.firstName : ''} readOnly/>
                    <TextInput label='Nazwisko' value={order?.form.surname ? order.form.surname : ''} readOnly/>
                </Group>     
                <TextInput mb={5} label='Adres' value={order?.form.address ? order.form.address : ''} readOnly/>
                <Group grow mb={5}>
                    <TextInput label='Kod pocztowy' value={order?.form.postalCode ? order.form.postalCode : ''} readOnly/>
                    <TextInput label='Miejscowość' value={order?.form.city ? order.form.city : ''} readOnly/>
                </Group>
                <TextInput mb={5} label='Kraj' value={order?.form.country ? order.form.country : ''} readOnly/>
                <Group grow noWrap mb={5}>
                    <TextInput label='Prefix' value={order?.form.prefix ? order.form.prefix : ''} readOnly/>
                    <TextInput label='Numer telefonu' value={order?.form.phoneNumber ? order.form.phoneNumber : ''} readOnly sx={{width: '100%'}} />
                </Group>
                <TextInput mb={20} label='E-mail' value={order?.form.email ? order.form.email : ''} readOnly/>
                <Divider size='md' label='Dane firmowe'/>
                <Group grow mb={40}>
                    <TextInput label='Nazwa firmy' value={order?.form.companyName ? order.form.companyName : ''} readOnly/>
                    <TextInput label='NIP' value={order?.form.nip ? order.form.nip : ''} readOnly/>
                </Group>
            </Group>
        </>
    )
}