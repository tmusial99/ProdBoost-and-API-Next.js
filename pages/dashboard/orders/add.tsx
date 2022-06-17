import { Box, Button, Container, Divider, Grid, Group, Image, LoadingOverlay, Modal, NumberInput, ScrollArea, Select, Table, Text, TextInput, Title, UnstyledButton } from "@mantine/core";
import { useForm, yupResolver } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { CheckIcon } from "@modulz/radix-icons";
import { createNewSortInstance, sort } from "fast-sort";
import { ObjectId } from "mongodb";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CirclePlus, Search, SortAscending, SortDescending, Trash } from "tabler-icons-react";
import Head from "../../../components/Head";
import Navbar from "../../../components/Navbar";
import Navigation from "../../../components/Navigation";
import NumberInputPositiveInt from "../../../components/NumberInputPositiveInt";
import {allCountries, allPhonePrefixes} from "../../../lib/allCountries";
import axios from "../../../lib/axios";
import getDatabase from "../../../lib/getDatabase";
import { orderFormSchema } from "../../../schemas/order";
import { AxiosError } from "axios";

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
    else if(!session?.user.permissions.includes('orders')){
        return {
            redirect: {
                destination: '/unauthorized',
                permanent: false
            }
        }
    }

    const {client, db} = await getDatabase();
    const allProducts = await db.collection('products').find({companyId: new ObjectId(session.user.companyId)})
        .project({_id: 0, name: 1, quantity: 1, tags: 1, productId: 1, image_url: 1, netto: 1, brutto: 1})
        .sort({productId: 1})
        .toArray();
    const company = await db.collection('companies').findOne({_id: new ObjectId(session.user.companyId)})
    
    await client.close()

    const isAdmin = session.user.role === 'CompanyOwner'
    
    return {props: {allProducts: allProducts, deliveryOptions: company?.deliveryOptions, isAdmin: isAdmin}}
}

type IProduct = {
    name: string,
    quantity: number,
    tags: string[],
    productId: number,
    image_url?: string,
    netto?: number,
    brutto?: number
}

type ISorting = [
    'productId' | 'name' | 'quantity' | 'netto' | 'brutto', 
    'asc' | 'desc'
]
export default function Page({allProducts, deliveryOptions, isAdmin}: {allProducts: IProduct[], deliveryOptions: {id: number, label: string, netto: number, brutto: number}[], isAdmin: boolean}){
    const items = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Zamówienia', href: '/dashboard/orders' },
        { title: 'Dodaj nowe zamówienie', href: '' }
    ]

    const [step, setStep] = useState(1);

    const deliveryState = useState(deliveryOptions)
    const [selectedDelivery, setSelectedDelivery] = useState('1')

    //#region Step 1
    const [basket, setBasket] = useState<IProduct[]>([]);
    const [products, setProducts] = useState(allProducts);

    const [quantityOfItemsInBasket, setQuantityOfItemsInBasket] = useState<{[productId: number]: number | null}>({});
    const [totalQuantity, setTotalQuantity] = useState(0);
    useEffect(() => {
        let value = 0
        Object.values(quantityOfItemsInBasket).forEach((v) => value += v as number)
        setTotalQuantity(value)
    }, [basket])

    const [nettoOfItemsInBasket, setNettoOfItemsInBasket] = useState<{[productId: number]: number | null}>({})
    const [totalNetto, setTotalNetto] = useState(0)
    useEffect(() => {
        let value = 0
        Object.values(nettoOfItemsInBasket).filter(x => x).forEach((v) => value += v as number)
        setTotalNetto(value + deliveryState[0][deliveryState[0].findIndex(x => x.id === parseInt(selectedDelivery))].netto)
    }, [basket, selectedDelivery])

    const [bruttoOfItemsInBasket, setBruttoOfItemsInBasket] = useState<{[productId: number]: number | null}>({})
    const [totalBrutto, setTotalBrutto] = useState(0)
    useEffect(() => {
        let value = 0
        Object.values(bruttoOfItemsInBasket).filter(x => x).forEach((v) => value += v as number)
        setTotalBrutto(value + deliveryState[0][deliveryState[0].findIndex(x => x.id === parseInt(selectedDelivery))].brutto)
    }, [basket, selectedDelivery])

    const addProductToBasket = (product: IProduct) => {
        let netto = 0;
        let brutto = 0;
        if(product.netto) netto = product.netto
        if(product.brutto) brutto = product.brutto

        netto
            ? setNettoOfItemsInBasket((curr) => ({...curr, [product.productId]: quantityOfItemsInBasket?.[product.productId] as number * netto}))
            : setNettoOfItemsInBasket((curr) => ({...curr, [product.productId]: null}))
        brutto
            ? setBruttoOfItemsInBasket((curr) => ({...curr, [product.productId]: quantityOfItemsInBasket?.[product.productId] as number * brutto}))
            : setBruttoOfItemsInBasket((curr) => ({...curr, [product.productId]: null}))
        
        setBasket((curr) => sort([...curr, product]).asc(x => x.productId));
        setProducts((curr) => curr.filter(x => x !== product))
    }

    //#region search
    const [searchValue, setSearchValue] = useState('')
    useEffect(() => {
        setProducts(allProducts.filter(x => !basket.includes(x)).filter(x => x.name.toLowerCase().includes(searchValue.toLowerCase()) || x.tags.some(v => v.includes(searchValue.toLowerCase()))))
    }, [searchValue])
    //#endregion search

    //#region sortingAllMaterials
    const [sorting, setSorting] = useState<ISorting>(['productId', 'asc'])

    const naturalSort = createNewSortInstance({
        comparer: new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare
    });

    useEffect(() => {
        if(sorting[0] === 'name'){
            sorting[1] === 'asc' 
            ? setProducts((curr) => (naturalSort(curr).asc(x => x[sorting[0]])))
            : setProducts((curr) => (naturalSort(curr).desc(x => x[sorting[0]])))
        }
        else{
            sorting[1] === 'asc' 
            ? setProducts((curr) => (sort(curr).asc(x => x[sorting[0]])))
            : setProducts((curr) => (sort(curr).desc(x => x[sorting[0]])))
        }
    },[sorting, searchValue])
    //#endregion sortingAllMaterials
    
    //#endregion Step 1
    
    //#region Step 2
    const modalForEditingDeliveryOpened = useState(false);

    const form = useForm({
        schema: yupResolver(orderFormSchema),
        initialValues: {
            firstName: '',
            surname: '',
            companyName: '',
            nip: '',
            address: '',
            postalCode: '',
            city: '',
            country: 'Polska',
            prefix: '+48',
            phoneNumber: '',
            email: ''
        }
    })

    //#endregion Step 2
    return(
        <>
            <Head title="ProdBoost - Dodaj nowe zamówienie"/>
            <Navbar/>
            <ModalForEditingDelivery openedState={modalForEditingDeliveryOpened} deliveryState={deliveryState} setSelectedDelivery={setSelectedDelivery}/>
            <Container>
                <Navigation items={items}/>
                <Title order={1} mb={20} align='center'>Dodaj nowe zamówienie</Title>
                <Group position='center'>
                    {step === 1 && (<Button radius='xl' leftIcon={<ArrowRight size={22}/>} disabled={!basket.length} onClick={() => setStep(2)}>Dalej</Button>)}
                    {step === 2 && (<Button radius='xl' leftIcon={<ArrowLeft size={22}/>} disabled={!basket.length} onClick={() => setStep(1)}>Wstecz</Button>)}
                </Group>

                <Title order={2} mt={30}>{step === 1 ? 'Produkty w koszyku' : 'Zamówienie'}</Title>
                {step === 1 && (
                    <>
                    {basket?.length === 0 && (<Text align='center' mt={20}>Brak produktów w koszyku.</Text>)}
                    {basket?.length > 0 && (
                        <ScrollArea type='always' mt={10}>
                            <Table fontSize='lg'>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th><Text>ID</Text></th>
                                        <th><Text>Nazwa</Text></th>
                                        <th><Text>Ilość całkowita</Text></th>
                                        <th><Text>Ilość w zamówieniu</Text></th>
                                        <th><Text>Całkowita cena netto</Text></th>
                                        <th><Text>Całkowita cena brutto</Text></th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                    basket.map((product) => (
                                        <tr key={product.productId}>
                                            <td style={{width: '100px'}}>
                                                <Image src={product?.image_url} withPlaceholder={!product?.image_url} height={100} width={100}/>
                                            </td>
                                            <td>{product.productId}</td>
                                            <td>{product.name}</td>
                                            <td>{product.quantity}</td>
                                            <td>{quantityOfItemsInBasket?.[product.productId]}</td>
                                            <td>
                                                {typeof nettoOfItemsInBasket?.[product.productId] === 'number' ? `${nettoOfItemsInBasket?.[product.productId]?.toFixed(2).toString().replace(/[.]/g, ',')} zł` : <Text color='red'>BRAK CENY</Text>}
                                            </td>
                                            <td>
                                                {typeof bruttoOfItemsInBasket?.[product.productId] === 'number' ? `${bruttoOfItemsInBasket?.[product.productId]?.toFixed(2).toString().replace(/[.]/g, ',')} zł` : <Text color='red'>BRAK CENY</Text>}
                                            </td>
                                            <td>
                                                    <Button px={5} color='red' onClick={() => {
                                                        setBasket((curr) => curr.filter(x => x !== product));
                                                        setQuantityOfItemsInBasket((curr) => ({...curr, [product.productId]: null}))
                                                        setNettoOfItemsInBasket((curr) => ({...curr, [product.productId]: null}))
                                                        setBruttoOfItemsInBasket((curr) => ({...curr, [product.productId]: null}))

                                                        if(sorting[0] === 'name'){
                                                            sorting[1] === 'asc' 
                                                            ? setProducts((curr) => (naturalSort([...curr, product]).asc(x => x[sorting[0]])))
                                                            : setProducts((curr) => (naturalSort([...curr, product]).desc(x => x[sorting[0]])))
                                                        }
                                                        else{
                                                            sorting[1] === 'asc' 
                                                            ? setProducts((curr) => (sort([...curr, product]).asc(x => x[sorting[0]])))
                                                            : setProducts((curr) => (sort([...curr, product]).desc(x => x[sorting[0]])))
                                                        }
                                                    }}>
                                                        <Trash/>
                                                    </Button>
                                            </td>
                                        </tr>
                                    ))
                                    }
                                    <tr style={{fontWeight: 'bold'}}>
                                        <td style={{width: '100px'}}></td>
                                        <td></td>
                                        <td>Podsumowanie</td>
                                        <td></td>
                                        <td>{totalQuantity}</td>
                                        <td>{`${totalNetto.toFixed(2).toString().replace(/[.]/g, ',')} zł`}</td>
                                        <td>{`${totalBrutto.toFixed(2).toString().replace(/[.]/g, ',')} zł`}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </Table>
                        </ScrollArea>
                    )}

                    <Title order={2} mt={40}>Wszystkie produkty</Title>
                    {products.length === 0 && (<Text align='center' mt={20}>Nie znaleziono żadnych produktów.</Text>)}
                    {products.length > 0 && (
                        <>
                            <TextInput mt={20} mx='auto' placeholder="Szukaj produktów..." icon={<Search/>} type='search' radius='xl' value={searchValue} onChange={(e) => setSearchValue(e.target.value)} sx={{maxWidth: '300px', width: '100%'}}/>
                            <ScrollArea type='always'>
                                <Table fontSize='lg' sx={{minWidth: '720px'}}>
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th><TableHeaderButtonMaterials label="ID" propertyName="productId" sorting={sorting} setSorting={setSorting}/></th>
                                            <th><TableHeaderButtonMaterials label="Nazwa" propertyName="name" sorting={sorting} setSorting={setSorting}/></th>
                                            <th><TableHeaderButtonMaterials label="Ilość" propertyName="quantity" sorting={sorting} setSorting={setSorting}/></th>
                                            <th><TableHeaderButtonMaterials label="Netto" propertyName="netto" sorting={sorting} setSorting={setSorting}/></th>
                                            <th><TableHeaderButtonMaterials label="Brutto" propertyName="brutto" sorting={sorting} setSorting={setSorting}/></th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                        products.map((product) => (
                                            <tr key={product.productId}>
                                                <td style={{width: '100px'}}>
                                                    <Image src={product?.image_url} withPlaceholder={!product?.image_url} height={100} width={100}/>
                                                </td>
                                                <td>{product.productId}</td>
                                                <td>{product.name}</td>
                                                <td>{product.quantity}</td>
                                                <td>{product.netto ? `${product.netto.toFixed(2).toString().replace(/[.]/g, ',')} zł` : null}</td>
                                                <td>{product.brutto ? `${product.brutto.toFixed(2).toString().replace(/[.]/g, ',')} zł` : null}</td>
                                                <td>
                                                    <Group noWrap>
                                                        <NumberInputPositiveInt 
                                                            placeholder='Ilość' 
                                                            sx={{width: '75px'}} 
                                                            min={1} 
                                                            max={product.quantity} 
                                                            value={quantityOfItemsInBasket?.[product.productId] as number} 
                                                            onChange={(value) => setQuantityOfItemsInBasket((curr) => ({...curr, [product.productId]: value as number}))}
                                                        />
                                                        <Button px={5} color='green' disabled={!quantityOfItemsInBasket?.[product.productId] || quantityOfItemsInBasket?.[product.productId] as number > product.quantity} onClick={() => addProductToBasket(product)}>
                                                            <CirclePlus/>
                                                        </Button>
                                                    </Group>
                                                </td>
                                            </tr>
                                        ))
                                        }
                                    </tbody>
                                </Table>
                            </ScrollArea>
                        </>
                    )}
                    </>
                )}

                {step === 2 && (
                    <>
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
                                    basket.map((product) => (
                                        <tr key={product.productId}>
                                            <td>{product.productId}</td>
                                            <td>{product.name}</td>
                                            <td>{quantityOfItemsInBasket?.[product.productId]}</td>
                                            <td>
                                                {typeof nettoOfItemsInBasket?.[product.productId] === 'number' ? `${nettoOfItemsInBasket?.[product.productId]?.toFixed(2).toString().replace(/[.]/g, ',')} zł` : '0,00zł'}
                                            </td>
                                            <td>
                                                {typeof bruttoOfItemsInBasket?.[product.productId] === 'number' ? `${bruttoOfItemsInBasket?.[product.productId]?.toFixed(2).toString().replace(/[.]/g, ',')} zł` : '0,00zł'}
                                            </td>
                                        </tr>
                                    ))
                                    }
                                    <tr>
                                        <td>Dostawa</td>
                                        <td>{deliveryState[0].filter(x => x.id === parseInt(selectedDelivery))[0].label}</td>
                                        <td>-</td>
                                        <td>{`${deliveryState[0].filter(x => x.id === parseInt(selectedDelivery))[0].netto.toFixed(2)} zł`}</td>
                                        <td>{`${deliveryState[0].filter(x => x.id === parseInt(selectedDelivery))[0].brutto.toFixed(2)} zł`}</td>
                                    </tr>
                                    <tr style={{fontWeight: 'bold'}}>
                                        <td></td>
                                        <td>Podsumowanie</td>
                                        <td></td>
                                        <td>{`${totalNetto.toFixed(2).toString().replace(/[.]/g, ',')} zł`}</td>
                                        <td>{`${totalBrutto.toFixed(2).toString().replace(/[.]/g, ',')} zł`}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </ScrollArea>
                        <Group position='center' align='flex-end' mt={15} mx='auto' noWrap sx={{maxWidth: '600px'}}>
                            <Select label='Dodaj metodę dostawy' data={Object.values(deliveryState[0]).map(x => ({label: `${x.label} - ${x.brutto.toFixed(2)} zł`, value: `${x.id}`}))} value={selectedDelivery} onChange={(value) => setSelectedDelivery(value as string)} sx={{width: '100%'}}/>
                            {isAdmin && (<Button onClick={() => modalForEditingDeliveryOpened[1](true)}>Edytuj</Button>)}
                        </Group>
                        <Form selectedDelivery={parseInt(selectedDelivery)} deliveryState={deliveryState[0]} basket={basket} quantityOfItemsInBasket={quantityOfItemsInBasket} form={form}/>
                    </>
                )}
            </Container>
        </>
    )
}

type IPropertyName = 'productId' | 'name' | 'quantity' | 'netto' | 'brutto'
export function TableHeaderButtonMaterials({label, propertyName, sorting, setSorting}: {label: string, propertyName: IPropertyName, sorting: ISorting, setSorting: Dispatch<SetStateAction<ISorting>>}){
    return(
        <UnstyledButton p={10} sx={{fontWeight: 700, width: '100%', height: '100%'}} onClick={() => setSorting((curr) => curr[0] === propertyName && curr[1] === 'asc' ? [propertyName, 'desc'] : [propertyName, 'asc'])}>
            <Group spacing={5} noWrap>
                {sorting[0] === propertyName && sorting[1] ==='asc' ? <SortAscending size={20}/> : null}
                {sorting[0] === propertyName && sorting[1] ==='desc' ? <SortDescending size={20}/> : null}
                <Text>{label}</Text>
            </Group>
        </UnstyledButton>
    )
}

function Form({deliveryState, selectedDelivery, basket, quantityOfItemsInBasket, form}: {deliveryState: {id: number, label: string, netto: number, brutto: number}[],form: any, selectedDelivery: number, basket: IProduct[], quantityOfItemsInBasket: {[productId: number]: number | null}}){
    const router = useRouter();
    const [sendingData, setSendingData] = useState(false);

    useEffect(() => {
        console.log(deliveryState)
    }, [deliveryState])

    const sendData = async () => {
        const {hasErrors} = form.validate()
        if(hasErrors) return;

        setSendingData(true);
        try{
            const delivery = deliveryState.find(delivery => delivery.id === selectedDelivery);
            const res = await axios.post('/api/orders/add', {
                basket: basket.map(x => ({
                    productId: x.productId,
                    name: x.name,
                    quantity: quantityOfItemsInBasket?.[x.productId],
                    totalNetto: x.netto ? quantityOfItemsInBasket?.[x.productId] as number * x.netto : 0,
                    totalBrutto: x.brutto ? quantityOfItemsInBasket?.[x.productId] as number * x.brutto : 0
                })),
                delivery: {
                    label: delivery?.label,
                    netto: delivery?.netto,
                    brutto: delivery?.brutto
                },
                form: form.values
            })
            router.replace(`/dashboard/orders/${res.data.orderId}`)
        }
        catch(e){
            const error = e as AxiosError
            console.error(error)
            setSendingData(false);
        }
    }

    return(
        <>
            <LoadingOverlay visible={sendingData} sx={{position:'fixed'}}/>
            <Group direction="column" grow mx='auto' mt={20} spacing={0} sx={{maxWidth: '600px'}}>
                <Divider size='md' label='Dane kontaktowe'/>
                <Group grow mb={5}>
                    <TextInput label='Imię' required {...form.getInputProps('firstName')}/>
                    <TextInput label='Nazwisko' required {...form.getInputProps('surname')}/>
                </Group>     
                <TextInput mb={5} label='Adres' required {...form.getInputProps('address')}/>
                <Group grow mb={5}>
                    <TextInput label='Kod pocztowy' required {...form.getInputProps('postalCode')}/>
                    <TextInput label='Miejscowość' required {...form.getInputProps('city')}/>
                </Group>
                <Select mb={5} label='Kraj' data={allCountries} searchable required {...form.getInputProps('country')}/>
                <Group grow noWrap mb={5}>
                    <Select data={allPhonePrefixes} label='Prefix' searchable required {...form.getInputProps('prefix')}/>
                    <TextInput label='Numer telefonu' required sx={{width: '100%'}} {...form.getInputProps('phoneNumber')}/>
                </Group>
                <TextInput mb={20} label='E-mail' {...form.getInputProps('email')}/>
                <Divider size='md' label='Dane firmowe'/>
                <Group grow mb={30}>
                    <TextInput label='Nazwa firmy' {...form.getInputProps('companyName')}/>
                    <TextInput label='NIP' {...form.getInputProps('nip')}/>
                </Group>
                <Button onClick={() => sendData()}>Dodaj zamówienie</Button>
            </Group>
        </>
    )
}

function ModalForEditingDelivery({openedState, deliveryState, setSelectedDelivery}: {openedState: [boolean, Dispatch<SetStateAction<boolean>>], setSelectedDelivery: Dispatch<SetStateAction<string>>, deliveryState: [{
    id: number;
    label: string;
    netto: number;
    brutto: number;
}[], Dispatch<SetStateAction<{
    id: number;
    label: string;
    netto: number;
    brutto: number;
}[]>>]}){
    const [sendingData, setSendingData] = useState(false)
    const [innerDeliveryState, setInnerDeliveryState] = useState<{id: number, label: string, netto: number | undefined, brutto: number | undefined}[]>(deliveryState[0])
    const [highestId , setHighestId] = useState(Math.max(...innerDeliveryState.map(x => x.id)))
    useEffect(() => {
        setHighestId(Math.max(...innerDeliveryState.map(x => x.id)))
    }, [innerDeliveryState])

    const anyError = innerDeliveryState.map(obj => Object.values(obj)).filter(arr => arr.includes(undefined) || arr.includes(NaN) || arr.includes('')).length
    
    const addNewDelivery = () => setInnerDeliveryState((curr) => ([...curr, {id: highestId + 1, label: '', netto: undefined, brutto: undefined}]))
       
    const sendData = async () => {
        setSendingData(true);
        try{
            const res = await axios.post('/api/admin/changeDeliveryOptions', {data: innerDeliveryState})
            setSelectedDelivery('1')
            showNotification({
                title: 'Udało się!',
                message: 'Poprawnie zapisano metody dostawy.',
                icon: <CheckIcon/>,
                autoClose: 8000,
                radius: 'lg',
                color: 'green'
            })
            deliveryState[1](res.data)
        }
        catch(e){
            console.log(e)
        }
        setSendingData(false)
    }

    return(
        <Modal
            centered
            closeOnClickOutside={false}
            withCloseButton={!sendingData}
            opened={openedState[0]}
            onClose={() => {openedState[1](false); setInnerDeliveryState(deliveryState[0])}}
            title={<Text size="xl" weight={500}>Edytuj metody dostawy</Text>}
            size='lg'
        >
            <Group direction="column" grow>
                {innerDeliveryState.map((delivery, index) => (
                    <Box key={index}>
                        <Grid columns={20}>
                            <Grid.Col span={3} className='deliveryOption'>
                                <TextInput value={delivery.id} readOnly label='ID dostawy'/>
                            </Grid.Col>
                            <Grid.Col span={9} className='deliveryOption'>
                                <TextInput value={delivery.label} readOnly={delivery.id === 1} label='Nazwa' onChange={(e) => setInnerDeliveryState((curr) => curr.map(obj => obj.id === delivery.id ? {...obj, label: e.target.value} : obj))}/>
                            </Grid.Col>
                            <Grid.Col span={4} className='deliveryOption'>
                                <NumberInput decimalSeparator="," precision={2} min={0} max={9999} value={delivery.netto} readOnly={delivery.id === 1} hideControls={delivery.id === 1} label='Cena netto [zł]' onChange={(value) => setInnerDeliveryState((curr) => curr.map(obj => obj.id === delivery.id ? {...obj, netto: value} : obj))}/>
                            </Grid.Col>
                            <Grid.Col span={4} className='deliveryOption'>
                                <NumberInput decimalSeparator="," precision={2} min={0} max={9999} value={delivery.brutto} readOnly={delivery.id === 1} hideControls={delivery.id === 1} label='Cena brutto [zł]' onChange={(value) => setInnerDeliveryState((curr) => curr.map(obj => obj.id === delivery.id ? {...obj, brutto: value} : obj))}/>
                            </Grid.Col>
                            
                        </Grid>
                        {delivery.id !== 1 && (
                            <Box mt={20} sx={{
                                '@media (max-width: 624px)':{
                                    display: 'flex',
                                    justifyContent: 'center'
                                }
                            }}>
                                <Button px={50} mx='auto' color='red' disabled={sendingData} onClick={() => setInnerDeliveryState((curr) => curr.filter(x => x !== delivery))} leftIcon={<Trash/>}>Usuń</Button>
                            </Box>
                        )}
                        <Divider my={10} size='md'/>
                    </Box>
                ))}
                <Group grow sx={{
                    '@media (max-width: 510px)':{
                        flexDirection: 'column'
                    }
                }}>
                    <Button sx={{'@media (max-width: 510px)': {minWidth: '100%'}}} leftIcon={<CirclePlus size={22}/>} color='orange' onClick={() => addNewDelivery()} disabled={innerDeliveryState.length > 9 || sendingData}>Dodaj nową dostawę</Button>
                    <Button sx={{'@media (max-width: 510px)': {minWidth: '100%'}}} color='green' disabled={!!anyError || JSON.stringify(innerDeliveryState) === JSON.stringify(deliveryState[0])} loading={sendingData} onClick={() => sendData()}>Zapisz</Button>
                </Group>
            </Group>
        </Modal>
    )
}