import { Button, Code, Container, Group, Modal, ScrollArea, Select, Table as TableMantine, Text, TextInput, Title, UnstyledButton } from "@mantine/core";
import { Prism } from "@mantine/prism";
import dayjs from "dayjs";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { ObjectId } from "mongodb";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CirclePlus, DatabaseImport, Key, Refresh, SortAscending, SortDescending, Trash } from "tabler-icons-react";
import { allOrdersAtom, filteredAndSortedOrdersAtom, IOrder, ISortingOrdersPropertyNames, selectedFilterForOrdersAtom, selectedSortingForOrdersAtom } from "../../../atoms/orders";
import Head from "../../../components/Head";
import Navbar from "../../../components/Navbar";
import Navigation from "../../../components/Navigation";
import axios from "../../../lib/axios";
import getDatabase from "../../../lib/getDatabase";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session = await getSession(ctx);
    if(!session){
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        }
    }
    else if(!session?.user.permissions.includes('orders')){
        return {
            redirect: {
                destination: '/unauthorized',
                permanent: false
            }
        }
    }
    
    const {client, db} = await getDatabase()
    const allOrders = await db.collection('orders').find({companyId: new ObjectId(session.user.companyId)}).project({_id: 0, companyId: 0}).toArray()
    
    let apiKey = null
    let userIsAdmin = false
    if(session?.user.role === 'CompanyOwner'){
        const company = await db.collection('companies').findOne({_id: new ObjectId(session.user.companyId)}, {projection: {_id: 0, apiKey: 1}})
        userIsAdmin = true
        if(company?.apiKey) apiKey = company?.apiKey
    }
    
    await client.close()
    return {props: {apiKey: apiKey, userIsAdmin: userIsAdmin, allOrdersFromDb: allOrders}}
}

export default function Page({apiKey, userIsAdmin, allOrdersFromDb}: {apiKey: string, userIsAdmin: boolean, allOrdersFromDb: IOrder[]}){
    const items = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Zamówienia', href: '' }
    ]
    const openedModalForAPI = useState(false);
    const setAllOrders = useSetAtom(allOrdersAtom);
    useEffect(() => {
        setAllOrders(allOrdersFromDb);
    },[])

    return(
        <>
            <Head title="ProdBoost - Zamówienia"/>
            <Navbar/>
            {userIsAdmin && (<ModalForAPI openedState={openedModalForAPI} apiKeyFromDb={apiKey}/>)}
            <Container>
                <Navigation items={items}/>
                <Title order={1} mb={20} align='center'>Zamówienia</Title>
                <Group position='center'>
                    <Link href='/dashboard/orders/add' passHref>
                        <Button component='a' radius='xl' leftIcon={<CirclePlus size={22}/>} sx={{'@media (max-width: 444px)': {minWidth: '100%'}}}>Dodaj nowe zamówienie</Button>
                    </Link>
                    {userIsAdmin && (<Button component='a' radius='xl' variant="outline" color='orange' leftIcon={<DatabaseImport size={22}/>} onClick={() => openedModalForAPI[1](true)} sx={{'@media (max-width: 444px)': {minWidth: '100%'}}}>Dodaj przez API</Button>)}
                </Group>
                <Table/>
            </Container>
        </>
    )
}

const deliveryStatuses = [
    {value: '0', label: 'Wszystkie'},
    {value: '1', label: 'Zamówienie złożone'},
    {value: '2', label: 'Zamówienie potwierdzone'},
    {value: '3', label: 'Zamówienie przyjęte do realizacji'},
    {value: '4', label: 'Zamówienie wysłane'},
    {value: '5', label: 'Zamówienie zrealizowane'},
    {value: '6', label: 'Zamówienie anulowane'}
]

function Table(){
    const filteredAndSortedOrders = useAtomValue(filteredAndSortedOrdersAtom);
    const [ordersFilter, setOrdersFilter] = useAtom(selectedFilterForOrdersAtom)

    return(
        <>
            <Select data={deliveryStatuses} onChange={(value: '0' | '1' | '2' | '3' | '4' | '5' | '6') => setOrdersFilter(value)} value={ordersFilter} label='Filtruj wg. statusu' mt={20}/>
            <ScrollArea>
                {filteredAndSortedOrders.length > 0 ? (
                    <TableMantine highlightOnHover>
                        <thead>
                            <tr>
                                <th><TableHeaderButtonOrders label="ID" propertyName="orderId"/></th>
                                <th><TableHeaderButtonOrders label="Data utworzenia" propertyName="createdAt"/></th>
                                <th><Text>Status</Text></th>
                                <th><TableHeaderButtonOrders label="Netto" propertyName="totalNetto"/></th>
                                <th><TableHeaderButtonOrders label="Brutto" propertyName="totalBrutto"/></th>
                            </tr>
                        </thead>
                        <tbody>
                        {
                            filteredAndSortedOrders.map((order) => (
                                <Link href={`orders/${order.orderId}`} key={order.orderId}>
                                    <tr key={order.orderId} className='tableLink'>
                                            <td>{order.orderId}</td>
                                            <td>{dayjs(order.createdAt).format('DD.M.YYYY | HH:mm') }</td>
                                            <td>{deliveryStatuses.filter(status => status.value === order.status.toString()).pop()?.label}</td>
                                            <td>{order.totalNetto ? `${order.totalNetto.toFixed(2).toString().replace(/[.]/g, ',')} zł`: '0,00 zł'}</td>
                                            <td>{order.totalBrutto ? `${order.totalBrutto.toFixed(2).toString().replace(/[.]/g, ',')} zł`: '0,00zł'}</td>
                                    </tr>
                                </Link> 
                            ))
                        }
                        </tbody>
                    </TableMantine>
                ):(
                    <Text color='dimmed' align="center" mt={10}>Nie znaleziono zamówień.</Text>
                )}
                
            </ScrollArea>
        </>
    )
}

function TableHeaderButtonOrders({label, propertyName}: {label: string, propertyName: ISortingOrdersPropertyNames}){
    const [selectedSorting, setSelectedSorting] = useAtom(selectedSortingForOrdersAtom)
    return(
        <UnstyledButton p={10} sx={{fontWeight: 700, width: '100%', height: '100%'}} onClick={() => setSelectedSorting((curr) => curr[0] === propertyName && curr[1] === 'asc' ? [propertyName, 'desc'] : [propertyName, 'asc'])}>
            <Group spacing={5} noWrap>
                {selectedSorting[0] === propertyName && selectedSorting[1] ==='asc' ? <SortAscending size={20}/> : null}
                {selectedSorting[0] === propertyName && selectedSorting[1] ==='desc' ? <SortDescending size={20}/> : null}
                <Text sx={{whiteSpace: 'nowrap'}}>{label}</Text>
            </Group>
        </UnstyledButton>
    )
}

function ModalForAPI({openedState, apiKeyFromDb}: {openedState: [boolean, Dispatch<SetStateAction<boolean>>], apiKeyFromDb: string}){
    const [apiKey, setApiKey] = useState<null | string>(apiKeyFromDb)
    const [sendingData, setSendingData] = useState(false)
    const getNewApiKey = async () => {
        setSendingData(true)
        try{
            const res = await axios.post('/api/orders/changeApiKey')
            setSendingData(false);
            setApiKey(res.data);
        }
        catch(e){
            console.log(e)
            setSendingData(false)
            return
        }
        
    }

    const deleteKey = async () => {
        setSendingData(true)
        try{
            const res = await axios.post('/api/orders/deleteApiKey')
            setSendingData(false);
            setApiKey(null);
        }
        catch(e){
            console.log(e)
            setSendingData(false)
            return
        }
        
    }
    const reqBody = `{
    "basket": {
        "productId": number, 
        "name": string, 
        "quantity": number, 
        "totalNetto": number, 
        "totalBrutto": number
    }[],
    "delivery": {
        "label": string,
        "netto": number,
        "brutto": number
    },
    "form": {
        "firstName": string (ex. 'Jan'),
        "surname": string (ex. 'Kowalski'),
        "address": string (ex. 'Długa 15/3'),
        "postalCode": string (ex. '60-537'),
        "city": string (ex. 'Poznań'),
        "country": string (ex. 'Polska'),
        "prefix": string (ex. '+48'),
        "phoneNumber": string (ex. '694 481 991'),
        "email": string | undefined (ex. 'jan.kowalski@gmail.com'),
        "companyName": string | undefined (ex. 'Nice Company'),
        "nip": string | undefined (ex. '6015484036')
    }
}`;

    return(
        <Modal
            centered
            closeOnClickOutside={false}
            withCloseButton={!sendingData}
            opened={openedState[0]}
            onClose={() => openedState[1](false)}
            title={<Text size="xl" weight={500}>Dodaj przez API</Text>}
            size='lg'
            styles={{modal: {maxWidth: '95vw', margin: 0}, inner: {padding: 0}}}
        >
            <Group direction="column" grow>
                <Group grow noWrap position="center" mb={10}>
                    {!apiKey && (<Button leftIcon={<Key size={20}/>} loading={sendingData} onClick={() => getNewApiKey()}>Dodaj nowy klucz API</Button>)}
                    {apiKey && (
                        <>
                            <TextInput value={apiKey} label='Klucz API' readOnly sx={{width: '100%'}}/>
                            <Group noWrap sx={{alignSelf: 'flex-end'}}>
                                <Button disabled={sendingData} onClick={() => getNewApiKey()}><Refresh/></Button>
                                <Button disabled={sendingData} color='red' onClick={() => deleteKey()}><Trash/></Button>
                            </Group>
                        </>
                    )}
                </Group>
                <Group grow direction="column" spacing={0}>
                    <Text>
                        Adres URL
                    </Text>
                    <Code sx={(theme) => ({
                        backgroundColor: theme.colorScheme === 'dark' ? 'rgb(20, 21, 23)' : theme.colors.gray[1]
                    })}>
                        <Text inherit color='blue' sx={{fontSize: '16px'}}>https://prodboost.vercel.app/api/orders/add?apiKey=<Text component="span" inherit color='red'>KLUCZ_API</Text></Text>
                    </Code>
                </Group>
                <Group direction="column" spacing={0}>
                    <Text>
                        Metoda HTTP
                    </Text>
                    <Code sx={(theme) => ({
                        backgroundColor: theme.colorScheme === 'dark' ? 'rgb(20, 21, 23)' : theme.colors.gray[1]
                    })}>
                        <Text inherit color='blue' sx={{fontSize: '16px'}}>POST</Text>
                    </Code>
                </Group>
                <Group direction="column" grow spacing={0} sx={{maxWidth: '100%'}}>
                    <Text>Ciało zapytania (JSON)</Text>
                    <Prism language="tsx" copyLabel="Kopiuj" copiedLabel="Skopiowano" sx={(theme) => ({
                        maxWidth: '100%',
                        backgroundColor: theme.colorScheme === 'dark' ? 'rgb(20, 21, 23)' : theme.colors.gray[1]
                    })} >{reqBody}</Prism>
                </Group>
            </Group>
        </Modal>
    )
}