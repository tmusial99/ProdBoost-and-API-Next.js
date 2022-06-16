import { Avatar, Badge, Button, Center, Checkbox, Container, Divider, Group, Image, LoadingOverlay, Modal, NumberInput, Paper, Tabs, Text, TextInput, Tooltip, TransferList, TransferListData, TransferListItemComponent, TransferListItemComponentProps } from "@mantine/core"
import { useSetState } from "@mantine/hooks"
import { showNotification } from "@mantine/notifications"
import { CheckIcon } from "@modulz/radix-icons"
import { AxiosError } from "axios"
import { sort } from "fast-sort"
import { ObjectId, WithId } from "mongodb"
import { GetServerSideProps } from "next"
import { getSession } from "next-auth/react"
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
import { IProduct } from "../../../types/items"

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session = await getSession(ctx)
    if(!session?.user.permissions.includes('products')){
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        }
    }

    const {client, db} = await getDatabase()
    const response = await db.collection('products').findOne({companyId: new ObjectId(session.user.companyId), productId: parseInt(ctx.query.slug as string)});
    if(!response) return {
        notFound: true
    }
    const allComponents = await db.collection('components').find({companyId: new ObjectId(session.user.companyId)}).project({_id: 1, componentId: 1, name: 1, image_url: 1}).sort({componentId: 1}).toArray();
    const allPacking = await db.collection('packing').find({companyId: new ObjectId(session.user.companyId)}).project({_id: 1, packingId: 1, name: 1, image_url: 1}).sort({componentId: 1}).toArray();
    
    const JsonProduct = JSON.stringify(response);
    const JsonAllComponents = JSON.stringify(allComponents);
    const JsonAllPacking = JSON.stringify(allPacking);
    await client.close();

    return {props: {JsonProduct, JsonAllComponents, JsonAllPacking}}
}


export default function Page({JsonProduct, JsonAllComponents, JsonAllPacking}: {JsonProduct: string, JsonAllComponents: string, JsonAllPacking: string}){
    const router = useRouter();
    const [product, setProduct] = useState<WithId<IProduct>>(JSON.parse(JsonProduct));
    const items = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Produkty', href: '/dashboard/products' },
        { title: `[ID: ${product.productId}] ${product.name}`, href: `/dashboard/products/${router.query.slug}`}
    ]

    const [deletingPhoto, setDeletingPhoto] = useState(false);
    const deletePhoto = async () => {
        setDeletingPhoto(true);
        try{
            await axios.post('/api/products/deletePicture', {productId: product._id.toString()})
            setProduct((curr) => ({...curr, image_url: undefined}))
            setDeletingPhoto(false);
        }
        catch(e){
            const error = e as AxiosError;
            console.log(error)
            setDeletingPhoto(false);
        }
    }

    const [activeTab, setActiveTab] = useState(0);


    const [form, setForm] = useSetState<IProduct>({
        name: product.name,
        quantity: product.quantity,
        tags: product.tags,
        netto: product.netto,
        brutto: product.brutto,
        length: product.length,
        width: product.width,
        depth: product.depth,
        weight: product.weight
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
            const res = await axios.post('/api/products/edit', {data: form, productId: product._id})
            setSendingData(false);
            setProduct((curr) => ({...curr, name: form.name}));
            showNotification({
                title: 'Udało się!',
                message: 'Poprawnie zapisano zmiany produktu.',
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
    const allComponents: {_id: string, componentId: number, name: string, image_url?: string}[] = JSON.parse(JsonAllComponents);
    const usedComponentsArr = allComponents.filter(component => product.usedComponents?.includes(component._id)).map(component => ({
        value: component._id,
        label: `[${component.componentId}] ${component.name}`,
        image: component.image_url,
        componentId: component.componentId
    }));
    const notUsedComponentsArr = allComponents.map(component => ({
            value: component._id,
            label: `[${component.componentId}] ${component.name}`,
            image: component.image_url,
            componentId: component.componentId
    })).filter(component => !product.usedComponents?.includes(component.value));
    const componentsForTransferList = useState<TransferListData>([notUsedComponentsArr, usedComponentsArr])


    const allPacking: {_id: string, packingId: number, name: string, image_url?: string}[] = JSON.parse(JsonAllPacking);
    const usedPackingArr = allPacking.filter(packing => product.usedPacking?.includes(packing._id)).map(packing => ({
        value: packing._id,
        label: `[${packing.packingId}] ${packing.name}`,
        image: packing.image_url,
        componentId: packing.packingId
    }));
    const notUsedPackingArr = allPacking.map(packing => ({
            value: packing._id,
            label: `[${packing.packingId}] ${packing.name}`,
            image: packing.image_url,
            componentId: packing.packingId
    })).filter(packing => !product.usedPacking?.includes(packing.value));
    const packingForTransferList = useState<TransferListData>([notUsedPackingArr, usedPackingArr])

    const richTextState = useState(product.richTextData !== '' && product.richTextData !== '<p><br></p>' ? product.richTextData : '<p class="ql-align-center"><strong>Nie znaleziono instrukcji dla tego produktu.</strong></p>');
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
    if(qrCode) return <QRcode setQrCode={setQrCode} id={product.productId as number} name={product.name} label='Produkt'/>

    return(
        <>
            <Head title={`ProdBoost - ${product.name}`}/>
            <Navbar/>
            <Container>
                <LoadingOverlay visible={sendingData} sx={{position: 'fixed'}}/>
                <ModalForDeleting modalForDeleting={modalForDeleting} setModalForDeleting={setModalForDeleting} product={product}/>
                <EditQuantityModal variant='products' openModalState={modalForEditQuantity} component={product} setComponent={setProduct} setForm={setForm}/>
                <Navigation items={items}/>
                    <Tabs position='center' active={activeTab} onTabChange={setActiveTab}>
                        <Tabs.Tab label='Produkt' icon={<ClipboardList size={20}/>} className='componentTabs'>
                            <Paper shadow="lg" radius="xl" withBorder mx='auto' mt={20} style={{maxWidth:400, width:'100%'}} sx={(theme) => ({
                                    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : "white"
                                })}>
                                    <Group direction="column" position="center" mt={20} mb={20}>
                                        <Avatar src={product.image_url} radius={100} size={200}/>
                                        <Group spacing={5}>
                                            <Text size='lg' weight='bold'>{product.name}</Text>
                                            <PopoverForUserInfo creator={product.createdBy as string} createdAt={product.createdAt as number}/>
                                        </Group>
                                        <Button leftIcon={<Trash/>} radius='xl' size='md' variant='outline' disabled={!product.image_url} loading={deletingPhoto} onClick={() => deletePhoto()}>Usuń obecne zdjęcie</Button>
                                    </Group>
                            </Paper>
                            <Group position='center' direction='column' grow mx='auto' mt={20} sx={{maxWidth: '400px'}}>
                                <TextInput label='Nazwa produktu' required  value={form.name} onChange={(e) => setForm({name: e.target.value})} error={error}/>
                                
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
                                    label='Produkty można wyszukiwać za pomocą nazwy lub tagów. Możesz użyć tagów w celu kategoryzacji przedmiotu np. Deska drewniana - tagi: "olchowa", "szlifowana".'
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
                                    <Button sx={{flexGrow: 1}} variant='outline' color='red' leftIcon={<Trash size={18}/>} onClick={() => setModalForDeleting(true)}>Usuń produkt</Button>
                                    <Button sx={{flexGrow: 1}} color='yellow' leftIcon={<Qrcode size={18}/>} onClick={() => setQrCode(true)}>Generuj kod QR</Button>
                                </Group>
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab label='Zmień zdjęcie' icon={<Camera size={20}/>} className='componentTabs'>
                            <Group direction='column' align='center' mt={20}>
                                <DropzoneForImages apiRoute='/api/products/changePicture' componentId={product._id.toString()} callback={(url) => {
                                    setProduct((curr) => ({...curr, image_url: url}));
                                    setActiveTab(0);
                                }}/>
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab label='Informacje' icon={<InfoCircle size={20}/>} className='componentTabs'>
                            <TransferListForUsedItems productId={product._id.toString()} state={componentsForTransferList} usedComponents={usedComponentsArr} setLoadingOverlay={setSendingData} variant='components'/>
                            <Divider size='md'/>
                            <TransferListForUsedItems productId={product._id.toString()} state={packingForTransferList} usedComponents={usedPackingArr} setLoadingOverlay={setSendingData} variant='packing'/>
                        </Tabs.Tab>
                        <Tabs.Tab label='Produkcja' icon={<Hammer size={20}/>} className='componentTabs'>
                            <RichTextComponent setLoadingOverlay={setSendingData} richTextState={richTextState} productId={product._id.toString()}/>
                        </Tabs.Tab>
                    </Tabs>
            </Container>
        </>
    )
}

function ModalForDeleting({modalForDeleting, setModalForDeleting, product}: {modalForDeleting: boolean, setModalForDeleting: Dispatch<boolean>, product: WithId<IProduct>}){
    const router = useRouter();
    const [sendingData, setSendingData] = useState(false)
    const deleteMaterial = async () => {
        setSendingData(true);
        try{
            await axios.post('/api/products/editRichText', {data: '<p><br></p>', productId: product._id.toString()})
            await axios.post('/api/products/delete', {productId: product._id});
            router.replace('/dashboard/products');
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
            title={<Text size='lg'>Czy na pewno chcesz usunąć produkt <Text size='lg' weight='bolder' component="span">{product.name}</Text>?</Text>}
        >
            <Text color='dimmed'>Produkt zostanie nieodwracalnie usunięty.</Text>
            <Text color='dimmed'>Chcesz kontynować?</Text>
            <Group mt={20} position="center" spacing='xl'>
                <Button disabled={sendingData} leftIcon={<X/>} color='red' onClick={() => setModalForDeleting(false)}>Nie</Button>
                <Button loading={sendingData} leftIcon={<Trash/>} color='green' variant='outline' onClick={() => deleteMaterial()}>Tak</Button>
            </Group>
        </Modal>
    )
}

function TransferListForUsedItems({productId, state, usedComponents, setLoadingOverlay, variant}: {productId: string, state: [TransferListData, Dispatch<SetStateAction<TransferListData>>], usedComponents: {value: string, label: string, image: string | undefined, componentId: number}[], setLoadingOverlay: Dispatch<SetStateAction<boolean>>, variant: 'packing' | 'components'}){
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

    const [usedComponentsArr, setUsedMaterialsArr] = useState(usedComponents);

    const [savingChanges, setSavingChanges] = useState(false);
    const saveChanges = async () => {
        setSavingChanges(true);
        setLoadingOverlay(true);
        const newIds = state[0][1].map(component => component.value);
        try{
            await axios.post(variant === 'components' ? '/api/products/editUsedComponents' : '/api/products/editUsedPacking', {data: newIds, productId: productId})
            setUsedMaterialsArr(state[0][1] as typeof usedComponentsArr)  
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
                    const firstArr = sort(value[0]).asc(component => component.componentId)
                    const secondArr = sort(value[1]).asc(component => component.componentId)
                    state[1]([firstArr, secondArr])
                }}
                itemComponent={ItemComponent}
                titles={[variant === 'components' ? 'Wszystkie komponenty' : 'Wszystkie opakowania', variant==='components' ? 'Użyte komponenty' : 'Użyte opakowania']}
                breakpoint='sm'
                listHeight={250}
                searchPlaceholder={variant==='components' ? 'Wyszukaj komponenty...' : 'Wyszukaj opakowania...'}
            />
            
            <Center my={20}>
                <Button sx={{width: 200}} onClick={() => saveChanges()} loading={savingChanges} disabled={state[0][1].every((v, i) =>  v?.value === usedComponentsArr[i]?.value) && state[0][1].length === usedComponentsArr.length}>Zapisz zmiany</Button>
            </Center>
        </>
    )
}

function RichTextComponent({richTextState, setLoadingOverlay, productId}: {richTextState: [string | undefined, Dispatch<SetStateAction<string | undefined>>], setLoadingOverlay: Dispatch<SetStateAction<boolean>>, productId: string}){
    const [editing, setEditing] = useState(false);
    const [sendingData, setSendingData] = useState(false);

    const sendData = async () => {
        setLoadingOverlay(true);
        setSendingData(true);
        try {
            await axios.post('/api/products/editRichText', {data: richTextState[0], productId: productId});
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