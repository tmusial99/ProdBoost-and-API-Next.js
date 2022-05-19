import { Alert, Box, Button, Container, Group, LoadingOverlay, Modal, PasswordInput, Text, Title } from "@mantine/core"
import { useSetState } from "@mantine/hooks";
import { AxiosError } from "axios";
import { signOut } from "next-auth/react";
import { FormEvent, useState } from "react";
import { AlertCircle, Camera, CameraSelfie, Key, Login } from "tabler-icons-react";
import DropzoneForImages from "../../../components/DropzoneForImages";
import WithAuth from "../../../components/hoc/WithAuth";
import Navbar from "../../../components/Navbar"
import Navigation from "../../../components/Navigation";
import axios from "../../../lib/axios";
import useFormValidation from "../../../lib/useFormValidation";
import { PasswordStrength } from "../../register";

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
    const [showAlert, setShowAlert] = useSetState({
        show: false,
        msg: ''
    })

    return(
        <>
            <Navbar/>
            <Container>
                <Navigation items={items}/>
                <Title order={1} mb={10} align='center'>Zmień zdjęcie profilowe</Title>
                <Group grow={true} align='center' direction="column">
                    {showAlert.show && (
                        <Alert icon={<AlertCircle size={16} />} title="Błąd!" color="red" withCloseButton variant="outline" onClose={() => setShowAlert({show:false})}>
                            {showAlert.msg}
                        </Alert>
                    )}
                    <Box mt={20}>
                        <DropzoneForImages apiRoute='/api/account/changePicture'/>
                    </Box>
                </Group>
            </Container>
        </>
    )
}