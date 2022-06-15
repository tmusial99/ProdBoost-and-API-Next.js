import { Button, Center, Container, Group, Text } from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import QRCode from "react-qr-code";
import { ArrowBack, Printer } from "tabler-icons-react";
import Head from "./Head";
import Navbar from "./Navbar";

export default function QRcode({setQrCode, id, name, label}: {setQrCode: Dispatch<SetStateAction<boolean>>, id: number, name: string, label: string}){
    return(
        <>
            <Head title={`ProdBoost - ${name}`}/>
            <Navbar/>
            <Container className='marginOnPrint'>
                <Group pt={30} className='marginOnPrint'>
                    <Center sx={{backgroundColor: 'white'}} p={5}>
                        <QRCode value={window.location.href} size={75}/>
                    </Center>
                    <Group direction="column" spacing={0}>
                        <Text className='textBlackOnPrint'>{label}</Text>
                        <Text className='textBlackOnPrint' weight={700}>{`ID: ${id}`}</Text>
                        <Text className='textBlackOnPrint' weight={500}>{name}</Text>
                    </Group>
                </Group>
                <Center mt={20} className='hideOnPrint'>
                    <Button mx={10} leftIcon={<ArrowBack size={20}/>} onClick={() => setQrCode(false)}>Cofnij</Button>
                    <Button mx={10} leftIcon={<Printer size={20}/>} onClick={() => window.print()} color='green'>Drukuj</Button>
                </Center>
            </Container>
        </>
      
    )
}