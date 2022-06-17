import { Box, Button, Center, Container, Group, Title } from "@mantine/core";
import { useRouter } from "next/router";
import { AlertTriangle, ArrowBackUp, Home } from "tabler-icons-react";
import Head from "../components/Head";
import Navbar from "../components/Navbar";

export default function Page(){
    const router = useRouter()
    return(
        <>
            <Head title="ProdBoost - Brak dostępu"/>
            <Navbar/>
            <Box px={10} sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flexGrow: 1
            }}>
                
                <AlertTriangle size={80}/>
                <Title order={1} align='center'>Nie masz dostępu do tej strony.</Title>
                <Group direction="column" grow mt={20}>
                    <Button leftIcon={<ArrowBackUp size={20}/>} onClick={() => router.back()}>Cofnij</Button>
                    <Button leftIcon={<Home size={20}/>} onClick={() => router.replace('/dashboard')}>Przejdź do strony głównej</Button>
                </Group>
            </Box>
        </>
    )
}