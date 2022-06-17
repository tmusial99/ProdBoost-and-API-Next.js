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
import { IPacking } from "../../../types/items";

type ISorting = [
    'packingId' | 'name' | 'quantity' | 'netto' | 'brutto', 
    'asc' | 'desc'
]

const items = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pakowanie', href: '' }
]

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
    else if(!session?.user.permissions.includes('packing')){
        return {
            redirect: {
                destination: '/unauthorized',
                permanent: false
            }
        }
    }

    const {client, db} = await getDatabase()
    const packing = await db.collection('packing').find({companyId: new ObjectId(session.user.companyId)}).project({_id: 0, image_url: 1, packingId: 1, name: 1, quantity: 1, tags: 1, netto: 1, brutto: 1}).toArray();
    await client.close()

    const JsonPacking = JSON.stringify(packing)
    
    return {props: {JsonPacking}}
}

export default function Page({JsonPacking}: {JsonPacking: string}){
    const initialpacking: IPacking[] = JSON.parse(JsonPacking)
    const [packing, setPacking] = useState<IPacking[]>(initialpacking)

    //#region search
    const [searchValue, setSearchValue] = useState('')
    useEffect(() => {
        setPacking(initialpacking.filter(x => x.name.toLowerCase().includes(searchValue.toLowerCase()) || x.tags.some(v => v.includes(searchValue.toLowerCase()))))
    }, [searchValue])
    //#endregion

    //#region sorting
    const [sorting, setSorting] = useState<ISorting>(['packingId', 'asc'])

    const naturalSort = createNewSortInstance({
        comparer: new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare
    });

    useEffect(() => {
        if(sorting[0] === 'name'){
            sorting[1] === 'asc' 
            ? setPacking((curr) => (naturalSort(curr).asc(packing => packing[sorting[0]])))
            : setPacking((curr) => (naturalSort(curr).desc(packing => packing[sorting[0]])))
        }
        else{
            sorting[1] === 'asc' 
            ? setPacking((curr) => (sort(curr).asc(packing => packing[sorting[0]])))
            : setPacking((curr) => (sort(curr).desc(packing => packing[sorting[0]])))
        }
    },[sorting, searchValue])
    //#endregion

    return(
        <>
            <Head title='ProdBoost - Pakowanie'/>
            <Navbar/>
            <Container>
                <Navigation items={items}/>
                <Title order={1} mb={20} align='center'>Opakowania</Title>
                <Group position='center'>
                    <Link href='/dashboard/packing/add' passHref>
                        <Button component='a' radius='xl' leftIcon={<CirclePlus size={22}/>} sx={{'@media (max-width: 576px)': {minWidth: '100%'}}}>Dodaj nowe opakowanie</Button>
                    </Link>
                    <TextInput icon={<Search/>} type='search' radius='xl' value={searchValue} onChange={(e) => setSearchValue(e.target.value)} sx={{maxWidth: '300px', width: '100%', '@media (max-width: 576px)': {minWidth: '100%'}}}/>
                </Group>
                {packing.length === 0 && (<Text align='center' mt={20}>Nie znaleziono żadnych opakowań.</Text>)}
                {packing.length > 0 && (
                    <ScrollArea type='always'>
                        <Table highlightOnHover mt={20} fontSize='lg' sx={{minWidth: '720px'}}>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th><TableHeaderButtonpacking label="ID" propertyName="packingId" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButtonpacking label="Nazwa" propertyName="name" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButtonpacking label="Ilość" propertyName="quantity" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButtonpacking label="Netto" propertyName="netto" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButtonpacking label="Brutto" propertyName="brutto" sorting={sorting} setSorting={setSorting}/></th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    packing.map((packing) => (
                                        <Link href={`packing/${packing.packingId}`} key={packing.packingId}>
                                            <tr key={packing.packingId} className='tableLink'>
                                                    <td style={{width: '100px'}}>
                                                        <Image src={packing.image_url} withPlaceholder={!packing.image_url} height={100} width={100}/>
                                                    </td>
                                                    <td>{packing.packingId}</td>
                                                    <td>{packing.name}</td>
                                                    <td>{packing.quantity}</td>
                                                    <td>{packing.netto ? `${packing.netto.toFixed(2).toString().replace(/[.]/g, ',')} zł` : null}</td>
                                                    <td>{packing.brutto ? `${packing.brutto.toFixed(2).toString().replace(/[.]/g, ',')} zł` : null}</td>
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

type IPropertyName = 'packingId' | 'name' | 'quantity' | 'netto' | 'brutto'
function TableHeaderButtonpacking({label, propertyName, sorting, setSorting}: {label: string, propertyName: IPropertyName, sorting: ISorting, setSorting: Dispatch<SetStateAction<ISorting>>}){
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