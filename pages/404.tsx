import { Box, Button, Group, Title } from "@mantine/core";
import { useRouter } from "next/router";
import { AlertTriangle, ArrowBackUp, Home } from "tabler-icons-react";
import Head from "../components/Head";
import Navbar from "../components/Navbar";

export default function NotFound(){
    const router = useRouter()
    return(
        <>
            <Head title='ProdBoost - Error 404'/>
            <Navbar/>
            <Box px={10} sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flexGrow: 1
            }}>
                
                <AlertTriangle size={80}/>
                <Title order={1} align='center'>Error 404</Title>
                <Title order={3} align='center'>Nie znaleziono podanej strony.</Title>
                <Group direction="column" grow mt={20}>
                    <Button leftIcon={<ArrowBackUp size={20}/>} onClick={() => router.back()}>Cofnij</Button>
                    <Button leftIcon={<Home size={20}/>} onClick={() => router.replace('/dashboard')}>Przejdź do strony głównej</Button>
                </Group>
            </Box>
        </>
    )
}