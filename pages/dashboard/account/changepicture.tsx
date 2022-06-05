import { Avatar, Box, Button, Center, Container, Group, Paper, Title } from "@mantine/core"
import { AxiosError } from "axios";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Trash } from "tabler-icons-react";
import DropzoneForImages from "../../../components/DropzoneForImages";
import Head from "../../../components/Head";
import WithAuth from "../../../components/hoc/WithAuth";
import Navbar from "../../../components/Navbar"
import Navigation from "../../../components/Navigation";
import axios from "../../../lib/axios";
import { updateSession } from "../../../lib/sessionHelpers";

export default function Page(){
    return(
        <WithAuth>
            <ChangePicture/>
        </WithAuth>
    )
}

const items = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Zdjęcie profilowe', href: '' }
]

function ChangePicture(){
    const {data:session} = useSession();
    const [deletingPhoto, setDeletingPhoto] = useState(false);

    async function deletePicture(e: any){
        e.preventDefault();
        setDeletingPhoto(true);
        try{
            const res = await axios.get('/api/account/deletePicture')
        }
        catch(e){
            const error = e as AxiosError
            console.log(error)
            setDeletingPhoto(false);
            return;
        }
        await updateSession()
        setDeletingPhoto(false);
    }

    return(
        <>
            <Head title='ProdBoost - Zdjęcie profilowe'/>
            <Navbar/>
            <Container>
                <Navigation items={items}/>
                <Title order={1} mb={10} align='center'>Twoje aktualne zdjęcie profilowe</Title>
                <Center>
                    <Paper shadow="lg" radius="xl" withBorder style={{flexGrow:1, maxWidth:400}} sx={(theme) => ({
                        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : "white"
                    })}>
                        <Group direction="column" position="center" mt={20} mb={20}>
                            <Avatar src={session?.user.image_url} radius={100} size={200}/>
                            <Button leftIcon={<Trash/>} radius='xl' size='md' variant='outline' disabled={!session?.user.image_url} loading={deletingPhoto} onClick={(e: any) => deletePicture(e)}>Usuń obecne zdjęcie</Button>
                        </Group>
                    </Paper>
                </Center>
                <Title order={1} mt={30} align='center'>Zmień zdjęcie profilowe</Title>
                <Group grow={true} align='center' direction="column">
                    <Box mt={10}>
                        <DropzoneForImages apiRoute='/api/account/changePicture'/>
                    </Box>
                </Group>
            </Container>
        </>
    )
}