import { Badge, Button, Container, Group, LoadingOverlay, NumberInput, TextInput, Title, Tooltip } from "@mantine/core";
import { useSetState } from "@mantine/hooks";
import { AxiosError } from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { CirclePlus, Trash } from "tabler-icons-react";
import Head from "../../../components/Head";
import WithAuth from "../../../components/hoc/WithAuth";
import Navbar from "../../../components/Navbar";
import Navigation from "../../../components/Navigation";
import axios from "../../../lib/axios";
import { IComponent } from "../../../types/items";

const items = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Komponenty', href: '/dashboard/components' },
    { title: 'Dodaj nowy komponent', href: ''}
]

export default function Page(){
    const router = useRouter();
    const [form, setForm] = useSetState<IComponent>({
        name: '',
        quantity: undefined,
        tags: [],
        netto: undefined,
        brutto: undefined,
        length: undefined,
        width: undefined,
        depth: undefined,
        weight: undefined
    })
    const [tag, setTag] = useState('')
    const addNewTag = (newTag: string) => {
        if(!form.tags.includes(newTag) && newTag.length > 0 && form.tags.length < 20) setForm((curr) => ({tags: [...curr.tags, newTag]}));
        setTag('');
    }

    //#region NAME VALIDATION
    const [error, setError] = useState('');
    useEffect(() => {
        if(form.name.length < 3 && form.name.length > 0) setError('Nazwa musi mieć minimalnie 3 znaki.');
        else if(form.name.length > 25) setError('Nazwa musi mieć maksymalnie 25 znaków.');
        else setError('')
    }, [form.name])
    //#endregion

    const [sendingData, setSendingData] = useState(false);
    const sendData = async () => {
        setSendingData(true);
        try{
            const res = await axios.post('/api/components/add', form)
            router.replace(`/dashboard/components/${res.data}`)
        }
        catch(e){
            const error = e as AxiosError;
            console.log(error)
            setSendingData(false);
        }
    }
    return(
        <WithAuth withPermission='components'>
            <Head title='ProdBoost - Dodaj nowy komponent'/>
            <Navbar/>
            <LoadingOverlay visible={sendingData} sx={{position:'fixed'}}/>
            <Container>
                <Navigation items={items}/>
                <Title order={1} mb={20} align='center'>Dodaj nowy komponent</Title>
                <Group position='center' direction='column' grow mx='auto' sx={{maxWidth: '400px'}}>
                    <TextInput label='Nazwa komponentu' required  value={form.name} onChange={(e) => setForm({name: e.target.value})} error={error}/>
                    
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

                    <Button mt={20} radius='xl' disabled={!!error.length || !form.name.length || form.quantity === undefined || isNaN(form.quantity)} onClick={() => sendData()}>Dodaj</Button>
                </Group>
            </Container>
        </WithAuth>
    )
}