import { Avatar, Badge, Box, Button, Center, Container, Group, LoadingOverlay, Modal, NumberInput, Paper, Popover, Tabs, Text, TextInput, Title, Tooltip } from "@mantine/core"
import { useSetState } from "@mantine/hooks"
import { showNotification } from "@mantine/notifications"
import { CheckIcon } from "@modulz/radix-icons"
import { AxiosError } from "axios"
import dayjs from "dayjs"
import { ObjectId, WithId } from "mongodb"
import { GetServerSideProps } from "next"
import { getSession } from "next-auth/react"
import { useRouter } from "next/router"
import { Dispatch, useEffect, useState } from "react"
import { CalendarTime, Camera, CirclePlus, ClipboardList, InfoCircle, Trash, Upload, X } from "tabler-icons-react"
import DropzoneForImages from "../../../components/DropzoneForImages"
import Head from "../../../components/Head"
import Navbar from "../../../components/Navbar"
import Navigation from "../../../components/Navigation"
import axios from "../../../lib/axios"
import getDatabase from "../../../lib/getDatabase"
import { IMaterial } from "../../../types/items"

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session = await getSession(ctx)
    if(!session?.user.permissions.includes('materials')){
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        }
    }

    const {client, db} = await getDatabase()
    const response = await db.collection('materials').findOne({companyId: new ObjectId(session.user.companyId), materialId: parseInt(ctx.query.slug as string)});
    if(!response) return {
        notFound: true
    }
    const creator = await db.collection('users').find({_id: response.createdById}).project({_id: 0, firstName: 1, surname: 1}).toArray();
    

    const JsonMaterial = JSON.stringify(response)
    const JsonCreator = JSON.stringify(creator[0])
    await client.close();

    return {props: {JsonMaterial, JsonCreator}}
}


export default function Page({JsonMaterial, JsonCreator}: {JsonMaterial: string, JsonCreator: string}){
    const router = useRouter();
    const [material, setMaterial] = useState<WithId<IMaterial>>(JSON.parse(JsonMaterial));
    const [creator, setCreator] = useState<{firstName: string, surname: string}>(JSON.parse(JsonCreator))
    const items = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Materiały', href: '/dashboard/materials' },
        { title: `[ID: ${material.materialId}] ${material.name}`, href: `/dashboard/materials/${router.query.slug}`}
    ]

    const [deletingPhoto, setDeletingPhoto] = useState(false);
    const deletePhoto = async () => {
        setDeletingPhoto(true);
        try{
            await axios.post('/api/materials/deletePicture', {componentId: material._id.toString()})
            setMaterial((curr) => ({...curr, image_url: undefined}))
            setDeletingPhoto(false);
        }
        catch(e){
            const error = e as AxiosError;
            console.log(error)
            setDeletingPhoto(false);
        }
    }

    const [activeTab, setActiveTab] = useState(0);


    const [form, setForm] = useSetState<IMaterial>({
        name: material.name,
        quantity: material.quantity,
        tags: material.tags,
        netto: material.netto,
        brutto: material.brutto,
        length: material.length,
        width: material.width,
        depth: material.depth,
        weight: material.weight
    })

    const [tag, setTag] = useState('')
    const addNewTag = (newTag: string) => {
        if(!form.tags.includes(newTag) && newTag.length > 0 && form.tags.length < 20) setForm((curr) => ({tags: [...curr.tags, newTag]}));
        setTag('');
    }

    //#region NAME VALIDATION

    const [modalForDeleting, setModalForDeleting] = useState(false);

    const [sendingData, setSendingData] = useState(false);
    const sendData = async () => {
        setSendingData(true);
        try{
            const res = await axios.post('/api/materials/edit', {data: form, componentId: material._id})
            setSendingData(false);
            setMaterial((curr) => ({...curr, name: form.name}));
            showNotification({
                title: 'Udało się!',
                message: 'Poprawnie zapisano zmiany materiału.',
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
    const [error, setError] = useState('');
    useEffect(() => {
        if(form.name.length < 3 && form.name.length > 0) setError('Nazwa musi mieć minimalnie 3 znaki.');
        else if(form.name.length > 25) setError('Nazwa musi mieć maksymalnie 25 znaków.');
        else setError('')
    }, [form.name])
    //#endregion

    return(
        <>
            <Head title={`ProdBoost - ${material.name}`}/>
            <Navbar/>
            <Container>
                <LoadingOverlay visible={sendingData} sx={{position: 'fixed'}}/>
                <ModalForDeleting modalForDeleting={modalForDeleting} setModalForDeleting={setModalForDeleting} material={material}/>
                <Navigation items={items}/>
                    <Tabs position='center' grow active={activeTab} onTabChange={setActiveTab}>
                        <Tabs.Tab label='Materiał' icon={<ClipboardList size={20}/>}>
                            <Paper shadow="lg" radius="xl" withBorder mx='auto' mt={20} style={{maxWidth:400, width:'100%'}} sx={(theme) => ({
                                    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : "white"
                                })}>
                                    <Group direction="column" position="center" mt={20} mb={20}>
                                        <Avatar src={material.image_url} radius={100} size={200}/>
                                        <Group spacing={5}>
                                            <Text size='lg' weight='bold'>{material.name}</Text>
                                            <PopoverForUserInfo creator={creator} createdAt={material.createdAt as number}/>
                                        </Group>
                                        <Button leftIcon={<Trash/>} radius='xl' size='md' variant='outline' disabled={!material.image_url} loading={deletingPhoto} onClick={() => deletePhoto()}>Usuń obecne zdjęcie</Button>
                                    </Group>
                            </Paper>
                            <Group position='center' direction='column' grow mx='auto' mt={20} sx={{maxWidth: '400px'}}>
                                <TextInput label='Nazwa materiału' required  value={form.name} onChange={(e) => setForm({name: e.target.value})} error={error}/>
                                
                                <NumberInput
                                    required
                                    label='Ilość'
                                    value={form.quantity}
                                    onChange={(value) => setForm({quantity: value})}
                                    min={0}
                                    max={99_999_999}
                                />
                                <Tooltip
                                    withArrow
                                    radius='md'
                                    wrapLines
                                    label='Materiały można wyszukiwać za pomocą nazwy lub tagów. Możesz użyć tagów w celu kategoryzacji przedmiotu np. Deska drewniana - tagi: "olchowa", "szlifowana".'
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
                                    <Button sx={{flexGrow: 1}} variant='outline' color='red' leftIcon={<Trash size={18}/>} onClick={() => setModalForDeleting(true)}>Usuń materiał</Button>
                                </Group>
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab label='Zmień zdjęcie' icon={<Camera size={20}/>}>
                            <Group direction='column' align='center' mt={20}>
                                <DropzoneForImages apiRoute='/api/materials/changePicture' componentId={material._id.toString()} callback={(url) => {
                                    setMaterial((curr) => ({...curr, image_url: url}));
                                    setActiveTab(0);
                                }}/>
                            </Group>
                        </Tabs.Tab>
                    </Tabs>
                
            </Container>
        </>
    )
}

function PopoverForUserInfo({creator, createdAt}: {creator: {firstName: string, surname: string}, createdAt: number}){
    const [opened, setOpened] = useState(false);
    return(
        <Popover
            opened={opened}
            onClose={() => setOpened(false)}
            position='bottom'
            placement='center'
            withArrow
            trapFocus={false}
            closeOnEscape={false}
            transition="pop-top-left"
            styles={{ body: { pointerEvents: 'none' } }}
            target={
              <Group onMouseEnter={() => setOpened(true)} onMouseLeave={() => setOpened(false)}>
                <InfoCircle/>
              </Group>
            }
        >
            <Text weight='bold'>Utworzone przez:</Text>
            <Text>{`${creator.firstName} ${creator.surname}`}</Text>
            <Group position='left' spacing={10} mt={15}>
                <CalendarTime size={15}/>
                <Text color='dimmed'>{dayjs(createdAt).format('DD.M.YYYY | HH:mm')}</Text>
            </Group>
        </Popover>
    )
}

function ModalForDeleting({modalForDeleting, setModalForDeleting, material}: {modalForDeleting: boolean, setModalForDeleting: Dispatch<boolean>, material: WithId<IMaterial>}){
    const router = useRouter();
    const [sendingData, setSendingData] = useState(false)
    const deleteMaterial = async () => {
        setSendingData(true);
        try{
            await axios.post('/api/materials/delete', {componentId: material._id});
            router.replace('/dashboard/materials');
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
            title={<Text size='lg'>Czy na pewno chcesz usunąć materiał <Text size='lg' weight='bolder' component="span">{material.name}</Text>?</Text>}
        >
            <Text color='dimmed'>Materiał zostanie nieodwracalnie usunięty.</Text>
            <Text color='dimmed'>Chcesz kontynować?</Text>
            <Group mt={20} position="center" spacing='xl'>
                <Button disabled={sendingData} leftIcon={<X/>} color='red' onClick={() => setModalForDeleting(false)}>Nie</Button>
                <Button loading={sendingData} leftIcon={<Trash/>} color='green' variant='outline' onClick={() => deleteMaterial()}>Tak</Button>
            </Group>
        </Modal>
    )
}