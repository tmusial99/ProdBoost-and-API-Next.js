import { Avatar, Badge, Button, Container, Group, Image, LoadingOverlay, Modal, NumberInput, Paper, ScrollArea, Table, Tabs, Text, TextInput, Title, Tooltip } from "@mantine/core"
import { useSetState } from "@mantine/hooks"
import { showNotification } from "@mantine/notifications"
import { CheckIcon } from "@modulz/radix-icons"
import { AxiosError } from "axios"
import { ObjectId, WithId } from "mongodb"
import { GetServerSideProps } from "next"
import { getSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/router"
import { Dispatch, useEffect, useState } from "react"
import { Calculator, Camera, CirclePlus, ClipboardList, InfoCircle, Qrcode, Trash, Upload, X } from "tabler-icons-react"
import DropzoneForImages from "../../../components/DropzoneForImages"
import EditQuantityModal from "../../../components/EditQuantityModal"
import Head from "../../../components/Head"
import Navbar from "../../../components/Navbar"
import Navigation from "../../../components/Navigation"
import PopoverForUserInfo from "../../../components/PopoverForUserInfo"
import QRcode from "../../../components/QRcode"
import axios from "../../../lib/axios"
import getDatabase from "../../../lib/getDatabase"
import { IPacking } from "../../../types/items"

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session = await getSession(ctx)
    if(!session?.user.permissions.includes('packing')){
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        }
    }

    const {client, db} = await getDatabase()
    const response = await db.collection('packing').findOne({companyId: new ObjectId(session.user.companyId), packingId: parseInt(ctx.query.slug as string)});
    if(!response) return {
        notFound: true
    }
    const inProducts = await db.collection('products').find({companyId: new ObjectId(session.user.companyId), usedPacking: response._id.toString()}).project({_id: 0, image_url: 1, productId: 1, name: 1}).toArray();
    
    const JsonPacking = JSON.stringify(response)
    const JsonInProducts = JSON.stringify(inProducts)
    await client.close();

    return {props: {JsonPacking, JsonInProducts}}
}


export default function Page({JsonPacking, JsonInProducts}: {JsonPacking: string, JsonInProducts: string}){
    const router = useRouter();
    const [packing, setPacking] = useState<WithId<IPacking>>(JSON.parse(JsonPacking));
    const [inProducts, setInProducts] = useState<{image_url?: string, productId: number, name: string}[]>(JSON.parse(JsonInProducts));
    const items = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pakowanie', href: '/dashboard/packing' },
        { title: `[ID: ${packing.packingId}] ${packing.name}`, href: `/dashboard/packing/${router.query.slug}`}
    ]

    const [deletingPhoto, setDeletingPhoto] = useState(false);
    const deletePhoto = async () => {
        setDeletingPhoto(true);
        try{
            await axios.post('/api/packing/deletePicture', {packingId: packing._id.toString()})
            setPacking((curr) => ({...curr, image_url: undefined}))
            setDeletingPhoto(false);
        }
        catch(e){
            const error = e as AxiosError;
            console.log(error)
            setDeletingPhoto(false);
        }
    }

    const [activeTab, setActiveTab] = useState(0);

    const [form, setForm] = useSetState<IPacking>({
        name: packing.name,
        quantity: packing.quantity,
        tags: packing.tags,
        netto: packing.netto,
        brutto: packing.brutto,
        length: packing.length,
        width: packing.width,
        depth: packing.depth,
        weight: packing.weight
    })

    const [tag, setTag] = useState('')
    const addNewTag = (newTag: string) => {
        if(!form.tags.includes(newTag) && newTag.length > 0 && form.tags.length < 20) setForm((curr) => ({tags: [...curr.tags, newTag]}));
        setTag('');
    }

    const modalForEditQuantity = useState(false);
    const [modalForDeleting, setModalForDeleting] = useState(false);

    const [sendingData, setSendingData] = useState(false);
    const sendData = async () => {
        setSendingData(true);
        try{
            const res = await axios.post('/api/packing/edit', {data: form, packingId: packing._id})
            setSendingData(false);
            setPacking((curr) => ({...curr, name: form.name, quantity: form.quantity}));
            showNotification({
                title: 'Udało się!',
                message: 'Poprawnie zapisano zmiany opakowania.',
                icon: <CheckIcon/>,
                autoClose: 8000,
                radius: 'lg',
                color: 'green'
            })
        }
        catch(e){
            const error = e as AxiosError;
            console.log(error)
            setSendingData(false);
        }
    }

    //#region NAME VALIDATION
    const [error, setError] = useState('');
    useEffect(() => {
        if(form.name.length < 3 && form.name.length > 0) setError('Nazwa musi mieć minimalnie 3 znaki.');
        else if(form.name.length > 25) setError('Nazwa musi mieć maksymalnie 25 znaków.');
        else setError('')
    }, [form.name])
    //#endregion

    const [qrCode, setQrCode] = useState(false);
    if(qrCode) return <QRcode setQrCode={setQrCode} id={packing.packingId as number} name={packing.name} label='Opakowanie'/>
    
    return(
        <>
            <Head title={`ProdBoost - ${packing.name}`}/>
            <Navbar/>
            <Container>
                <LoadingOverlay visible={sendingData} sx={{position: 'fixed'}}/>
                <ModalForDeleting modalForDeleting={modalForDeleting} setModalForDeleting={setModalForDeleting} packing={packing}/>
                <EditQuantityModal variant='packing' openModalState={modalForEditQuantity} component={packing} setComponent={setPacking} setForm={setForm}/>
                <Navigation items={items}/>
                    <Tabs position='center' grow active={activeTab} onTabChange={setActiveTab}>
                        <Tabs.Tab label='Opakowanie' icon={<ClipboardList size={20}/>}>
                            <Paper shadow="lg" radius="xl" withBorder mx='auto' mt={20} style={{maxWidth:400, width:'100%'}} sx={(theme) => ({
                                    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : "white"
                                })}>
                                    <Group direction="column" position="center" mt={20} mb={20}>
                                        <Avatar src={packing.image_url} radius={100} size={200}/>
                                        <Group spacing={5}>
                                            <Text size='lg' weight='bold'>{packing.name}</Text>
                                            <PopoverForUserInfo creator={packing.createdBy as string} createdAt={packing.createdAt as number}/>
                                        </Group>
                                        <Button leftIcon={<Trash/>} radius='xl' size='md' variant='outline' disabled={!packing.image_url} loading={deletingPhoto} onClick={() => deletePhoto()}>Usuń obecne zdjęcie</Button>
                                    </Group>
                            </Paper>
                            <Group position='center' direction='column' grow mx='auto' mt={20} sx={{maxWidth: '400px'}}>
                                <TextInput label='Nazwa opakowania' required  value={form.name} onChange={(e) => setForm({name: e.target.value})} error={error}/>
                                
                                <Group grow noWrap align='flex-end'>
                                    <NumberInput
                                        required
                                        label='Ilość'
                                        value={form.quantity}
                                        onChange={(value) => setForm({quantity: value})}
                                        min={0}
                                        max={99_999_999}
                                        sx={{maxWidth: '100%'}}
                                    />
                                    <Button sx={{maxWidth: '50px'}} px={0} radius='xl' variant='outline' onClick={() => modalForEditQuantity[1](true)}><Calculator/></Button>
                                </Group>
                                
                                <Tooltip
                                    withArrow
                                    radius='md'
                                    wrapLines
                                    label='Opakowanie można wyszukiwać za pomocą nazwy lub tagów. Możesz użyć tagów w celu kategoryzacji przedmiotu np. Deska drewniana - tagi: "olchowa", "szlifowana".'
                                    width={250}
                                >
                                    <TextInput 
                                        rightSection={
                                            <Button compact variant='subtle' px={0} sx={{width:'30px'}} onClick={() => 
                                                addNewTag(tag.toLowerCase())}>
                                                    <CirclePlus/>
                                            </Button>
                                        } 
                                        onKeyDown={(e) => {if(e.key === 'Enter') addNewTag(tag.toLowerCase())}}
                                        label='Tagi'
                                        value={tag}
                                        onChange={(e) => setTag(e.target.value)}
                                    />
                                </Tooltip>
                                

                                <Group position='center' sx={{maxWidth: '500px'}}>
                                    {form.tags.map((tag, index) => (
                                        <Badge size='lg' key={index} rightSection={
                                            <Button compact variant='subtle' px={0} sx={{width:'20px'}} onClick={() => setForm((curr) => ({tags: curr.tags.filter(x => x !== tag)}))}>
                                                <Trash style={{marginTop:'9px'}}/>
                                            </Button>
                                        }>
                                            {tag}
                                        </Badge>
                                    ))}
                                </Group>
                                
                                <NumberInput 
                                    label='Cena netto [zł]'  
                                    value={form.netto} 
                                    onChange={(value) => setForm({netto: value})}
                                    precision={2}
                                    min={0}
                                    max={99_999_999}
                                    decimalSeparator=','
                                />
                                <NumberInput 
                                    label='Cena brutto [zł]'  
                                    value={form.brutto} 
                                    onChange={(value) => setForm({brutto: value})}
                                    precision={2}
                                    min={0}
                                    max={99_999_999}
                                    decimalSeparator=','
                                />
                                <NumberInput 
                                    label='Długość [cm]'  
                                    value={form.length} 
                                    onChange={(value) => setForm({length: value})}
                                    precision={1}
                                    min={0}
                                    max={99_999_999}
                                    decimalSeparator=','
                                />
                                <NumberInput 
                                    label='Szerokość [cm]'  
                                    value={form.width} 
                                    onChange={(value) => setForm({width: value})}
                                    precision={1}
                                    min={0}
                                    max={99_999_999}
                                    decimalSeparator=','
                                />
                                <NumberInput 
                                    label='Głębokość [cm]'  
                                    value={form.depth} 
                                    onChange={(value) => setForm({depth: value})}
                                    precision={1}
                                    min={0}
                                    max={99_999_999}
                                    decimalSeparator=','
                                />
                                <NumberInput 
                                    label='Waga [kg]'  
                                    value={form.weight} 
                                    onChange={(value) => setForm({weight: value})}
                                    precision={3}
                                    min={0}
                                    max={99_999_999}
                                    decimalSeparator=','
                                />

                                <Group position='center' mt={20} mx='auto' sx={{maxWidth: 400}}>
                                    <Button sx={{flexGrow: 1}} leftIcon={<Upload size={18}/>} disabled={!!error.length || !form.name.length || form.quantity === undefined || isNaN(form.quantity)} loading={sendingData} onClick={() => sendData()}>Zapisz zmiany</Button>
                                    <Button sx={{flexGrow: 1}} variant='outline' color='red' leftIcon={<Trash size={18}/>} onClick={() => setModalForDeleting(true)}>Usuń opakowanie</Button>
                                    <Button sx={{flexGrow: 1}} color='yellow' leftIcon={<Qrcode size={18}/>} onClick={() => setQrCode(true)}>Generuj kod QR</Button>
                                </Group>
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab label='Zmień zdjęcie' icon={<Camera size={20}/>}>
                            <Group direction='column' align='center' mt={20}>
                                <DropzoneForImages apiRoute='/api/packing/changePicture' componentId={packing._id.toString()} callback={(url) => {
                                    setPacking((curr) => ({...curr, image_url: url}));
                                    setActiveTab(0);
                                }}/>
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab label='Informacje' icon={<InfoCircle size={20}/>}>
                            <Title order={2} mt={20}>Użyto w produktach</Title>
                            {inProducts.length === 0 && (<Text align='center' mt={20}>Nie znaleziono produktów.</Text>)}
                            {inProducts.length > 0 && (
                                <ScrollArea type='always' mt={10}>
                                    <Table highlightOnHover fontSize='lg' sx={{minWidth: '720px'}}>
                                        <thead>
                                            <tr>
                                                <th></th>
                                                <th>ID</th>
                                                <th>Nazwa</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                inProducts.map((product) => (
                                                    <Link href={`/dashboard/products/${product.productId}`} key={product.productId}>
                                                        <tr key={product.productId} className='tableLink'>
                                                                <td style={{width: '100px'}}>
                                                                    <Image src={product.image_url} withPlaceholder={!product.image_url} height={100} width={100}/>
                                                                </td>
                                                                <td>{product.productId}</td>
                                                                <td>{product.name}</td>
                                                        </tr>
                                                    </Link> 
                                                ))
                                            }
                                        </tbody>
                                    </Table>
                                </ScrollArea>
                            )}
                        </Tabs.Tab>
                    </Tabs>
            </Container>
        </>
    )
}

function ModalForDeleting({modalForDeleting, setModalForDeleting, packing}: {modalForDeleting: boolean, setModalForDeleting: Dispatch<boolean>, packing: WithId<IPacking>}){
    const router = useRouter();
    const [sendingData, setSendingData] = useState(false)
    const deleteMaterial = async () => {
        setSendingData(true);
        try{
            await axios.post('/api/packing/delete', {packingId: packing._id});
            router.replace('/dashboard/packing');
        }
        catch(e){
            const error = e as AxiosError;
            console.log(error)
            setSendingData(false);
        }
    }
    return (
        <Modal
            opened={modalForDeleting}
            centered
            onClose={() => setModalForDeleting(false)}
            withCloseButton={!sendingData}
            closeOnClickOutside={false}
            title={<Text size='lg'>Czy na pewno chcesz usunąć opakowanie <Text size='lg' weight='bolder' component="span">{packing.name}</Text>?</Text>}
        >
            <Text color='dimmed'>Opakowanie zostanie nieodwracalnie usunięte.</Text>
            <Text color='dimmed'>Chcesz kontynować?</Text>
            <Group mt={20} position="center" spacing='xl'>
                <Button disabled={sendingData} leftIcon={<X/>} color='red' onClick={() => setModalForDeleting(false)}>Nie</Button>
                <Button loading={sendingData} leftIcon={<Trash/>} color='green' variant='outline' onClick={() => deleteMaterial()}>Tak</Button>
            </Group>
        </Modal>
    )
}