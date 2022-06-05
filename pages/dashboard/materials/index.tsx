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
import { IMaterial } from "../../../types/items";

type ISorting = [
    'materialId' | 'name' | 'quantity' | 'netto' | 'brutto', 
    'asc' | 'desc'
]

const items = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Materiały', href: '' }
]

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
    const materials = await db.collection('materials').find({companyId: new ObjectId(session.user.companyId)}).project({_id: 0, image_url: 1, materialId: 1, name: 1, quantity: 1, tags: 1, netto: 1, brutto: 1}).toArray();
    await client.close()

    const JsonMaterials = JSON.stringify(materials)
    
    return {props: {JsonMaterials}}
}

export default function Page({JsonMaterials}: {JsonMaterials: string}){
    const initialMaterials: IMaterial[] = JSON.parse(JsonMaterials)
    const [materials, setMaterials] = useState<IMaterial[]>(initialMaterials)

    //#region search
    const [searchValue, setSearchValue] = useState('')
    useEffect(() => {
        setMaterials(initialMaterials.filter(x => x.name.toLowerCase().includes(searchValue.toLowerCase()) || x.tags.some(v => v.includes(searchValue.toLowerCase()))))
    }, [searchValue])
    //#endregion

    //#region sorting
    const [sorting, setSorting] = useState<ISorting>(['materialId', 'asc'])

    const naturalSort = createNewSortInstance({
        comparer: new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare
    });

    useEffect(() => {
        if(sorting[0] === 'name'){
            sorting[1] === 'asc' 
            ? setMaterials((curr) => (naturalSort(curr).asc(material => material[sorting[0]])))
            : setMaterials((curr) => (naturalSort(curr).desc(material => material[sorting[0]])))
        }
        else{
            sorting[1] === 'asc' 
            ? setMaterials((curr) => (sort(curr).asc(material => material[sorting[0]])))
            : setMaterials((curr) => (sort(curr).desc(material => material[sorting[0]])))
        }
    },[sorting, searchValue])
    //#endregion

    return(
        <>
            <Head title='ProdBoost - Materiały'/>
            <Navbar/>
            <Container>
                <Navigation items={items}/>
                <Title order={1} mb={20} align='center'>Materiały</Title>
                <Group position='center'>
                    <Link href='/dashboard/materials/add' passHref>
                        <Button component='a' radius='xl' leftIcon={<CirclePlus size={22}/>}>Dodaj nowy materiał</Button>
                    </Link>
                    <TextInput icon={<Search/>} type='search' radius='xl' value={searchValue} onChange={(e) => setSearchValue(e.target.value)} sx={{maxWidth: '300px', width: '100%'}}/>
                </Group>
                {materials.length === 0 && (<Text align='center' mt={20}>Nie znaleziono żadnych materiałów.</Text>)}
                {materials.length > 0 && (
                    <ScrollArea type='always'>
                        <Table highlightOnHover mt={20} fontSize='lg' sx={{minWidth: '720px'}}>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th><TableHeaderButton label="ID" propertyName="materialId" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButton label="Nazwa" propertyName="name" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButton label="Ilość" propertyName="quantity" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButton label="Netto" propertyName="netto" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButton label="Brutto" propertyName="brutto" sorting={sorting} setSorting={setSorting}/></th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    materials.map((material) => (
                                        <Link href={`materials/${material.materialId}`} key={material.materialId}>
                                            <tr key={material.materialId} className='tableLink'>
                                                    <td style={{width: '100px'}}>
                                                        <Image src={material.image_url} withPlaceholder={!material.image_url} height={100} width={100}/>
                                                    </td>
                                                    <td>{material.materialId}</td>
                                                    <td>{material.name}</td>
                                                    <td>{material.quantity}</td>
                                                    <td>{material.netto ? `${material.netto} zł` : null}</td>
                                                    <td>{material.brutto ? `${material.brutto} zł` : null}</td>
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

type IPropertyName = 'materialId' | 'name' | 'quantity' | 'netto' | 'brutto'
function TableHeaderButton({label, propertyName, sorting, setSorting}: {label: string, propertyName: IPropertyName, sorting: ISorting, setSorting: Dispatch<SetStateAction<ISorting>>}){
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