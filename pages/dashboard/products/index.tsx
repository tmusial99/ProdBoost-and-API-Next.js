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
import { IProduct } from "../../../types/items";

type ISorting = [
    'productId' | 'name' | 'quantity' | 'netto' | 'brutto', 
    'asc' | 'desc'
]

const items = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Produkty', href: '' }
]

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
    const products = await db.collection('products').find({companyId: new ObjectId(session.user.companyId)}).project({_id: 0, image_url: 1, productId: 1, name: 1, quantity: 1, tags: 1, netto: 1, brutto: 1}).toArray();
    await client.close()

    const JsonProducts = JSON.stringify(products)
    
    return {props: {JsonProducts}}
}

export default function Page({JsonProducts}: {JsonProducts: string}){
    const initialproducts: IProduct[] = JSON.parse(JsonProducts)
    const [products, setProducts] = useState<IProduct[]>(initialproducts)

    //#region search
    const [searchValue, setSearchValue] = useState('')
    useEffect(() => {
        setProducts(initialproducts.filter(x => x.name.toLowerCase().includes(searchValue.toLowerCase()) || x.tags.some(v => v.includes(searchValue.toLowerCase()))))
    }, [searchValue])
    //#endregion

    //#region sorting
    const [sorting, setSorting] = useState<ISorting>(['productId', 'asc'])

    const naturalSort = createNewSortInstance({
        comparer: new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare
    });

    useEffect(() => {
        if(sorting[0] === 'name'){
            sorting[1] === 'asc' 
            ? setProducts((curr) => (naturalSort(curr).asc(product => product[sorting[0]])))
            : setProducts((curr) => (naturalSort(curr).desc(product => product[sorting[0]])))
        }
        else{
            sorting[1] === 'asc' 
            ? setProducts((curr) => (sort(curr).asc(product => product[sorting[0]])))
            : setProducts((curr) => (sort(curr).desc(product => product[sorting[0]])))
        }
    },[sorting, searchValue])
    //#endregion

    return(
        <>
            <Head title='ProdBoost - Produkty'/>
            <Navbar/>
            <Container>
                <Navigation items={items}/>
                <Title order={1} mb={20} align='center'>Produkty</Title>
                <Group position='center'>
                    <Link href='/dashboard/products/add' passHref>
                        <Button component='a' radius='xl' leftIcon={<CirclePlus size={22}/>}>Dodaj nowy produkt</Button>
                    </Link>
                    <TextInput icon={<Search/>} type='search' radius='xl' value={searchValue} onChange={(e) => setSearchValue(e.target.value)} sx={{maxWidth: '300px', width: '100%'}}/>
                </Group>
                {products.length === 0 && (<Text align='center' mt={20}>Nie znaleziono żadnych produktów.</Text>)}
                {products.length > 0 && (
                    <ScrollArea type='always'>
                        <Table highlightOnHover mt={20} fontSize='lg' sx={{minWidth: '720px'}}>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th><TableHeaderButtonMaterials label="ID" propertyName="productId" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButtonMaterials label="Nazwa" propertyName="name" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButtonMaterials label="Ilość" propertyName="quantity" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButtonMaterials label="Netto" propertyName="netto" sorting={sorting} setSorting={setSorting}/></th>
                                    <th><TableHeaderButtonMaterials label="Brutto" propertyName="brutto" sorting={sorting} setSorting={setSorting}/></th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    products.map((product) => (
                                        <Link href={`products/${product.productId}`} key={product.productId}>
                                            <tr key={product.productId} className='tableLink'>
                                                    <td style={{width: '100px'}}>
                                                        <Image src={product.image_url} withPlaceholder={!product.image_url} height={100} width={100}/>
                                                    </td>
                                                    <td>{product.productId}</td>
                                                    <td>{product.name}</td>
                                                    <td>{product.quantity}</td>
                                                    <td>{product.netto ? `${product.netto.toFixed(2).toString().replace(/[.]/g, ',')} zł` : null}</td>
                                                    <td>{product.brutto ? `${product.brutto.toFixed(2).toString().replace(/[.]/g, ',')} zł` : null}</td>
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

type IPropertyName = 'productId' | 'name' | 'quantity' | 'netto' | 'brutto'
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