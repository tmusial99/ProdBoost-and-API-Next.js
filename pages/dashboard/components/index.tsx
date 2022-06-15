import { Button, Container, Group, Image, ScrollArea, Table, Text, TextInput, Title, UnstyledButton } from "@mantine/core";
import { createNewSortInstance, sort } from "fast-sort";
import { ObjectId } from "mongodb";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CirclePlus, Search, SortAscending, SortDescending } from "tabler-icons-react";
import Head from "../../../components/Head";
import Navbar from "../../../components/Navbar";
import Navigation from "../../../components/Navigation";
import getDatabase from "../../../lib/getDatabase";
import { IComponent } from "../../../types/items";

type ISorting = [
    'componentId' | 'name' | 'quantity' | 'netto' | 'brutto', 
    'asc' | 'desc'
]

const items = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Komponenty', href: '' }
]

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
    const components = await db.collection('components').find({companyId: new ObjectId(session.user.companyId)}).project({_id: 0, image_url: 1, componentId: 1, name: 1, quantity: 1, tags: 1, netto: 1, brutto: 1}).toArray();
    await client.close()

    const JsonComponents = JSON.stringify(components)
    
    return {props: {JsonComponents}}
}

export default function Page({JsonComponents}: {JsonComponents: string}){
    const initialComponents: IComponent[] = JSON.parse(JsonComponents)
    const [components, setComponents] = useState<IComponent[]>(initialComponents)

    //#region search
    const [searchValue, setSearchValue] = useState('')
    useEffect(() => {
        setComponents(initialComponents.filter(x => x.name.toLowerCase().includes(searchValue.toLowerCase()) || x.tags.some(v => v.includes(searchValue.toLowerCase()))))
    }, [searchValue])
    //#endregion

    //#region sorting
    const [sorting, setSorting] = useState<ISorting>(['componentId', 'asc'])

    const naturalSort = createNewSortInstance({
        comparer: new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare
    });

    useEffect(() => {
        if(sorting[0] === 'name'){
            sorting[1] === 'asc' 
            ? setComponents((curr) => (naturalSort(curr).asc(component => component[sorting[0]])))
            : setComponents((curr) => (naturalSort(curr).desc(component => component[sorting[0]])))
        }
        else{
            sorting[1] === 'asc' 
            ? setComponents((curr) => (sort(curr).asc(component => component[sorting[0]])))
            : setComponents((curr) => (sort(curr).desc(component => component[sorting[0]])))
        }
    },[sorting, searchValue])
    //#endregion

    return(
        <>
            <Head title='ProdBoost - Komponenty'/>
            <Navbar/>
            <Container>
                <Navigation items={items}/>
                <Title order={1} mb={20} align='center'>Komponenty</Title>
                <Group position='center'>
                    <Link href='/dashboard/components/add' passHref>
                        <Button component='a' radius='xl' leftIcon={<CirclePlus size={22}/>}>Dodaj nowy komponent</Button>
                    </Link>
                    <TextInput icon={<Search/>} type='search' radius='xl' value={searchValue} onChange={(e) => setSearchValue(e.target.value)} sx={{maxWidth: '300px', width: '100%'}}/>
                </Group>
                {components.length === 0 && (<Text align='center' mt={20}>Nie znaleziono żadnych komponentów.</Text>)}
                {components.length > 0 && (
                    <ScrollArea type='always'>
                        <Table highlightOnHover mt={20} fontSize='lg' sx={{minWidth: '720px'}}>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th><TableHeaderButtonMaterials label="ID" propertyName="componentId" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButtonMaterials label="Nazwa" propertyName="name" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButtonMaterials label="Ilość" propertyName="quantity" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButtonMaterials label="Netto" propertyName="netto" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButtonMaterials label="Brutto" propertyName="brutto" sorting={sorting} setSorting={setSorting}/></th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    components.map((component) => (
                                        <Link href={`components/${component.componentId}`} key={component.componentId}>
                                            <tr key={component.componentId} className='tableLink'>
                                                    <td style={{width: '100px'}}>
                                                        <Image src={component.image_url} withPlaceholder={!component.image_url} height={100} width={100}/>
                                                    </td>
                                                    <td>{component.componentId}</td>
                                                    <td>{component.name}</td>
                                                    <td>{component.quantity}</td>
                                                    <td>{component.netto ? `${component.netto.toFixed(2).toString().replace(/[.]/g, ',')} zł` : null}</td>
                                                    <td>{component.brutto ? `${component.brutto.toFixed(2).toString().replace(/[.]/g, ',')} zł` : null}</td>
                                            </tr>
                                        </Link> 
                                    ))
                                }
                            </tbody>
                        </Table>
                    </ScrollArea>
                )}
                
            </Container>
        </>
    )
}

type IPropertyName = 'componentId' | 'name' | 'quantity' | 'netto' | 'brutto'
export function TableHeaderButtonMaterials({label, propertyName, sorting, setSorting}: {label: string, propertyName: IPropertyName, sorting: ISorting, setSorting: Dispatch<SetStateAction<ISorting>>}){
    return(
        <UnstyledButton p={10} sx={{fontWeight: 700, width: '100%', height: '100%'}} onClick={() => setSorting((curr) => curr[0] === propertyName && curr[1] === 'asc' ? [propertyName, 'desc'] : [propertyName, 'asc'])}>
            <Group spacing={5}>
                {sorting[0] === propertyName && sorting[1] ==='asc' ? <SortAscending size={20}/> : null}
                {sorting[0] === propertyName && sorting[1] ==='desc' ? <SortDescending size={20}/> : null}
                <Text>{label}</Text>
            </Group>
        </UnstyledButton>
    )
}