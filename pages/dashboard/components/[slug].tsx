import { Avatar, Badge, Button, Center, Checkbox, Container, Group, Image, LoadingOverlay, Modal, NumberInput, Paper, ScrollArea, Table, Tabs, Text, TextInput, Title, Tooltip, TransferList, TransferListData, TransferListItemComponent, TransferListItemComponentProps } from "@mantine/core"
import { useSetState } from "@mantine/hooks"
import { showNotification } from "@mantine/notifications"
import { CheckIcon } from "@modulz/radix-icons"
import { AxiosError } from "axios"
import { sort } from "fast-sort"
import { ObjectId, WithId } from "mongodb"
import { GetServerSideProps } from "next"
import { getSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/router"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { Calculator, Camera, CirclePlus, ClipboardList, Edit, EditOff, Hammer, InfoCircle, Qrcode, Trash, Upload, X } from "tabler-icons-react"
import DropzoneForImages from "../../../components/DropzoneForImages"
import EditQuantityModal from "../../../components/EditQuantityModal"
import Head from "../../../components/Head"
import Navbar from "../../../components/Navbar"
import Navigation from "../../../components/Navigation"
import PopoverForUserInfo from "../../../components/PopoverForUserInfo"
import QRcode from "../../../components/QRcode"
import RichText from "../../../components/RichText"
import axios from "../../../lib/axios"
import getDatabase from "../../../lib/getDatabase"
import { IComponent } from "../../../types/items"

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session = await getSession(ctx)
    if(!session?.user.permissions.includes('components')){
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        }
    }

    const {client, db} = await getDatabase()
    const response = await db.collection('components').findOne({companyId: new ObjectId(session.user.companyId), componentId: parseInt(ctx.query.slug as string)});
    if(!response) return {
        notFound: true
    }
    const allMaterials = await db.collection('materials').find({companyId: new ObjectId(session.user.companyId)}).project({_id: 1, materialId: 1, name: 1, image_url: 1}).sort({materialId: 1}).toArray();
    const inProducts = await db.collection('products').find({companyId: new ObjectId(session.user.companyId), usedComponents: response._id.toString()}).project({_id: 0, image_url: 1, productId: 1, name: 1}).toArray();
    
    const JsonComponent = JSON.stringify(response);
    const JsonAllMaterials = JSON.stringify(allMaterials);
    const JsonInProducts = JSON.stringify(inProducts);
    await client.close();

    return {props: {JsonComponent, JsonAllMaterials, JsonInProducts}}
}


export default function Page({JsonComponent, JsonAllMaterials, JsonInProducts}: {JsonComponent: string, JsonAllMaterials: string, JsonInProducts: string}){
    const router = useRouter();
    const [component, setComponent] = useState<WithId<IComponent>>(JSON.parse(JsonComponent));
    const [inProducts, setInProducts] = useState<{image_url?: string, productId: number, name: string}[]>(JSON.parse(JsonInProducts))
    const items = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Komponenty', href: '/dashboard/components' },
        { title: `[ID: ${component.componentId}] ${component.name}`, href: `/dashboard/components/${router.query.slug}`}
    ]

    const [deletingPhoto, setDeletingPhoto] = useState(false);
    const deletePhoto = async () => {
        setDeletingPhoto(true);
        try{
            await axios.post('/api/components/deletePicture', {componentId: component._id.toString()})
            setComponent((curr) => ({...curr, image_url: undefined}))
            setDeletingPhoto(false);
        }
        catch(e){
            const error = e as AxiosError;
            console.log(error)
            setDeletingPhoto(false);
        }
    }

    const [activeTab, setActiveTab] = useState(0);


    const [form, setForm] = useSetState<IComponent>({
        name: component.name,
        quantity: component.quantity,
        tags: component.tags,
        netto: component.netto,
        brutto: component.brutto,
        length: component.length,
        width: component.width,
        depth: component.depth,
        weight: component.weight
    })

    const [tag, setTag] = useState('')
    const addNewTag = (newTag: string) => {
        if(!form.tags.includes(newTag) && newTag.length > 0 && form.tags.length < 20) setForm((curr) => ({tags: [...curr.tags, newTag]}));
        setTag('');
    }

    const [modalForDeleting, setModalForDeleting] = useState(false);


    //#region sending edited data
    const [sendingData, setSendingData] = useState(false);
    const sendData = async () => {
        setSendingData(true);
        try{
            const res = await axios.post('/api/components/edit', {data: form, componentId: component._id})
            setSendingData(false);
            setComponent((curr) => ({...curr, name: form.name}));
            showNotification({
                title: 'Udało się!',
                message: 'Poprawnie zapisano zmiany komponentu.',
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
    //#endregion

    //#region States for childs
    const allMaterials: {_id: string, materialId: number, name: string, image_url?: string}[] = JSON.parse(JsonAllMaterials);
    const usedMaterialsArr = allMaterials.filter(material => component.usedMaterials?.includes(material._id)).map(material => ({
        value: material._id,
        label: `[${material.materialId}] ${material.name}`,
        image: material.image_url,
        materialId: material.materialId
    }));
    const notUsedMaterialsArr = allMaterials.map(material => ({
            value: material._id,
            label: `[${material.materialId}] ${material.name}`,
            image: material.image_url,
            materialId: material.materialId
    })).filter(material => !component.usedMaterials?.includes(material.value));
    const stateForTransferList = useState<TransferListData>([notUsedMaterialsArr, usedMaterialsArr])

    const richTextState = useState(component.richTextData !== '' && component.richTextData !== '<p><br></p>' ? component.richTextData : '<p class="ql-align-center"><strong>Nie znaleziono instrukcji dla tego komponentu.</strong></p>');
    const modalForEditQuantity = useState(false)
    //#endregion

    //#region NAME VALIDATION
    const [error, setError] = useState('');
    useEffect(() => {
        if(form.name.length < 3 && form.name.length > 0) setError('Nazwa musi mieć minimalnie 3 znaki.');
        else if(form.name.length > 25) setError('Nazwa musi mieć maksymalnie 25 znaków.');
        else setError('')
    }, [form.name])
    //#endregion

    const [qrCode, setQrCode] = useState(false);
    if(qrCode) return <QRcode setQrCode={setQrCode} id={component.componentId as number} name={component.name} label='Komponent'/>

    return(
        <>
            <Head title={`ProdBoost - ${component.name}`}/>
            <Navbar/>
            <Container>
                <LoadingOverlay visible={sendingData} sx={{position: 'fixed'}}/>
                <ModalForDeleting modalForDeleting={modalForDeleting} setModalForDeleting={setModalForDeleting} component={component}/>
                <EditQuantityModal variant='components' openModalState={modalForEditQuantity} component={component} setComponent={setComponent} setForm={setForm}/>
                <Navigation items={items}/>
                    <Tabs position='center' active={activeTab} onTabChange={setActiveTab}>
                        <Tabs.Tab label='Komponent' icon={<ClipboardList size={20}/>} className='componentTabs'>
                            <Paper shadow="lg" radius="xl" withBorder mx='auto' mt={20} style={{maxWidth:400, width:'100%'}} sx={(theme) => ({
                                    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : "white"
                                })}>
                                    <Group direction="column" position="center" mt={20} mb={20}>
                                        <Avatar src={component.image_url} radius={100} size={200}/>
                                        <Group spacing={5}>
                                            <Text size='lg' weight='bold'>{component.name}</Text>
                                            <PopoverForUserInfo creator={component.createdBy as string} createdAt={component.createdAt as number}/>
                                        </Group>
                                        <Button leftIcon={<Trash/>} radius='xl' size='md' variant='outline' disabled={!component.image_url} loading={deletingPhoto} onClick={() => deletePhoto()}>Usuń obecne zdjęcie</Button>
                                    </Group>
                            </Paper>
                            <Group position='center' direction='column' grow mx='auto' mt={20} sx={{maxWidth: '400px'}}>
                                <TextInput label='Nazwa komponentu' required  value={form.name} onChange={(e) => setForm({name: e.target.value})} error={error}/>
                                
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
                                    label='Komponenty można wyszukiwać za pomocą nazwy lub tagów. Możesz użyć tagów w celu kategoryzacji przedmiotu np. Deska drewniana - tagi: "olchowa", "szlifowana".'
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
                                    <Button sx={{flexGrow: 1}} variant='outline' color='red' leftIcon={<Trash size={18}/>} onClick={() => setModalForDeleting(true)}>Usuń komponent</Button>
                                    <Button sx={{flexGrow: 1}} color='yellow' leftIcon={<Qrcode size={18}/>} onClick={() => setQrCode(true)}>Generuj kod QR</Button>
                                </Group>
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab label='Zmień zdjęcie' icon={<Camera size={20}/>} className='componentTabs'>
                            <Group direction='column' align='center' mt={20}>
                                <DropzoneForImages apiRoute='/api/components/changePicture' componentId={component._id.toString()} callback={(url) => {
                                    setComponent((curr) => ({...curr, image_url: url}));
                                    setActiveTab(0);
                                }}/>
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab label='Informacje' icon={<InfoCircle size={20}/>} className='componentTabs'>
                            <TransferListForMaterials componentId={component._id.toString()} state={stateForTransferList} usedMaterials={usedMaterialsArr} setLoadingOverlay={setSendingData}/>
                            <Title order={2} mt={40}>Użyto w produktach</Title>
                            {inProducts.length === 0 && (<Text align='center' mt={20}>Nie znaleziono komponentów.</Text>)}
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
                        <Tabs.Tab label='Produkcja' icon={<Hammer size={20}/>} className='componentTabs'>
                            <RichTextComponent setLoadingOverlay={setSendingData} richTextState={richTextState} componentId={component._id.toString()}/>
                        </Tabs.Tab>
                    </Tabs>
            </Container>
        </>
    )
}

function ModalForDeleting({modalForDeleting, setModalForDeleting, component}: {modalForDeleting: boolean, setModalForDeleting: Dispatch<boolean>, component: WithId<IComponent>}){
    const router = useRouter();
    const [sendingData, setSendingData] = useState(false)
    const deleteMaterial = async () => {
        setSendingData(true);
        try{
            await axios.post('/api/components/editRichText', {data: '<p><br></p>', componentId: component._id.toString()})
            await axios.post('/api/components/delete', {componentId: component._id});
            router.replace('/dashboard/components');
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
            title={<Text size='lg'>Czy na pewno chcesz usunąć komponent <Text size='lg' weight='bolder' component="span">{component.name}</Text>?</Text>}
        >
            <Text color='dimmed'>Komponent zostanie nieodwracalnie usunięty.</Text>
            <Text color='dimmed'>Chcesz kontynować?</Text>
            <Group mt={20} position="center" spacing='xl'>
                <Button disabled={sendingData} leftIcon={<X/>} color='red' onClick={() => setModalForDeleting(false)}>Nie</Button>
                <Button loading={sendingData} leftIcon={<Trash/>} color='green' variant='outline' onClick={() => deleteMaterial()}>Tak</Button>
            </Group>
        </Modal>
    )
}

function TransferListForMaterials({componentId, state, usedMaterials, setLoadingOverlay}: {componentId: string, state: [TransferListData, Dispatch<SetStateAction<TransferListData>>], usedMaterials: {value: string, label: string, image: string | undefined, materialId: number}[], setLoadingOverlay: Dispatch<SetStateAction<boolean>>}){
    const ItemComponent: TransferListItemComponent = ({
        data,
        selected,
      }: TransferListItemComponentProps) => (
        <Group noWrap>
          <Image src={data.image} withPlaceholder={!data.image} width={50} height={50}/>
          <div style={{ flex: 1 }}>
            <Text size="sm" weight={500}>
              {data.label}
            </Text>
          </div>
          <Checkbox checked={selected} onChange={() => {}} tabIndex={-1} sx={{ pointerEvents: 'none' }} />
        </Group>
    );

    const [usedMaterialsArr, setUsedMaterialsArr] = useState(usedMaterials);

    const [savingChanges, setSavingChanges] = useState(false);
    const saveChanges = async () => {
        setSavingChanges(true);
        setLoadingOverlay(true);
        const newIds = state[0][1].map(material => material.value);
        try{
            await axios.post('/api/components/editUsedMaterials', {data: newIds, componentId: componentId})
            setUsedMaterialsArr(state[0][1] as typeof usedMaterialsArr)  
            showNotification({
                title: 'Udało się!',
                message: 'Poprawnie zapisano zmiany.',
                icon: <CheckIcon/>,
                autoClose: 8000,
                radius: 'lg',
                color: 'green'
            })
        }
        catch(e){
            const error = e as AxiosError;
            console.log(error)
        }
        setSavingChanges(false);
        setLoadingOverlay(false);
    }

    return(
        <>
            <TransferList
                mt={10}
                value={state[0]}
                onChange={(value) => {
                    const firstArr = sort(value[0]).asc(material => material.materialId)
                    const secondArr = sort(value[1]).asc(material => material.materialId)
                    state[1]([firstArr, secondArr])
                }}
                itemComponent={ItemComponent}
                titles={['Wszystkie materiały', 'Użyte materiały']}
                breakpoint='sm'
                listHeight={250}
                searchPlaceholder='Wyszukaj materiały...'
            />
            
            <Center mt={20}>
                <Button sx={{width: 200}} onClick={() => saveChanges()} loading={savingChanges} disabled={state[0][1].every((v, i) =>  v?.value === usedMaterialsArr[i]?.value) && state[0][1].length === usedMaterialsArr.length}>Zapisz zmiany</Button>
            </Center>
        </>
    )
}

function RichTextComponent({richTextState, setLoadingOverlay, componentId}: {richTextState: [string | undefined, Dispatch<SetStateAction<string | undefined>>], setLoadingOverlay: Dispatch<SetStateAction<boolean>>, componentId: string}){
    const [editing, setEditing] = useState(false);
    const [sendingData, setSendingData] = useState(false);

    const sendData = async () => {
        setLoadingOverlay(true);
        setSendingData(true);
        try {
            await axios.post('/api/components/editRichText', {data: richTextState[0], componentId: componentId});
            showNotification({
                title: 'Udało się!',
                message: 'Poprawnie zapisano zmiany.',
                icon: <CheckIcon/>,
                autoClose: 8000,
                radius: 'lg',
                color: 'green'
            })
        } catch (e) {
            const error = e as AxiosError;
            console.log(error);
        }
        setSendingData(false);
        setLoadingOverlay(false);
    }

    const handleImageUpload = (file: File): Promise<string> => new Promise(async (resolve, reject) => {
        const formData = new FormData()
        formData.append('image', file);

        axios.post('/api/uploadPictureRichText', formData)
            .then(res => resolve(res.data as string))
            .catch(() => reject(new Error('Błąd - nie udało się dodać obrazu')))
    });
 
    return(
        <>
            <RichText value={richTextState[0] as string} onChange={richTextState[1]} readOnly={!editing} onImageUpload={handleImageUpload} labels={{
                save: 'Zapisz',
                remove: 'Usuń',
                edit: 'Edytuj',
                bold: 'Pogrubienie',
                italic: 'Kursywa',
                underline: 'Podkreślenie',
                strike: 'Przekreślenie',
                link: 'Link',
                unorderedList: 'Lista nieuporządkowana',
                orderedList: 'Lista uporządkowana',
                clean: 'Usuń stylowanie',
                video: 'Wideo',
                alignCenter: 'Wyśrodkuj',
                alignLeft: 'Wyrównaj do lewej',
                alignRight: 'Wyrównaj do prawej',
                image: 'Zdjęcie',
                h1: 'Tytuł 1',
                h2: 'Tytuł 2',
                h3: 'Tytuł 3',
                h4: 'Tytuł 4',
                h5: 'Tytuł 5',
                h6: 'Tytuł 6',
                sub: 'Indeks dolny',
                sup: 'Indeks górny',
                code: 'Kod',
                codeBlock: 'Blok kodu',
                blockquote: 'Cytat',
            }} styles={{root: {fontSize: '1em'}}}/>
            <Group position='center' mt={20}>
                <Button onClick={() => setEditing((curr) => curr ? false : true)} leftIcon={editing ? <EditOff size={18}/> : <Edit size={18}/>}>{editing ? 'Wyłącz edytor' : 'Edytuj'}</Button>
                {
                    editing && (<Button variant='outline' color='green' leftIcon={<Upload size={18}/>} loading={sendingData} onClick={() => sendData()}>Zapisz</Button>)
                }
            </Group>
        </>
    )
}