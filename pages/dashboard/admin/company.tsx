import { Button, Container, Group, TextInput, Title } from "@mantine/core"
import { useSetState } from "@mantine/hooks";
import { AxiosError } from "axios";
import { FormEvent, useState } from "react";
import { Edit } from "tabler-icons-react";
import Head from "../../../components/Head";
import WithAuth from "../../../components/hoc/WithAuth";
import Navbar from "../../../components/Navbar"
import Navigation from "../../../components/Navigation";
import axios from "../../../lib/axios";
import { updateSession } from "../../../lib/sessionHelpers";
import useFormValidation from "../../../lib/useFormValidation";

export default function Page(){
    return(
        <WithAuth withRole="CompanyOwner">
            <Company/>
        </WithAuth>
    )
}

const items = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Ustawienia firmy', href: '' }
]

function Company(){
    const [form, setForm] = useSetState({
        companyName: ''
    })
    const {errors, anyError, setErrors} = useFormValidation(form, {
        companyName:{
            minLength: [3, 'Nazwa firmy musi mieć minimalnie 3 znaki.'],
            maxLength: [25, 'Nazwa firmy musi mieć maksymalnie 25 znaków.']
        }
    })

    const [sendingData, setSendingData] = useState(false);
    const sendData = async (e: FormEvent) => {
        e.preventDefault();

        setSendingData(true);
        try{
            await axios.post('/api/admin/changeCompanyName', {companyName: form.companyName});
            await updateSession();
        }
        catch(e){
            const error = e as AxiosError
            console.log(error)
        }
        setSendingData(false);
    }
    return(
        <>
            <Head title='ProdBoost - Ustawienia firmy'/>
            <Navbar/>
            <Container>
                <Navigation items={items}/>
                <Title order={1} mb={10} align='center'>Zmień nazwę firmy</Title>
                <Group grow={true} align='center' direction="column">
                    <form style={{maxWidth: '350px', width:'100%'}} onSubmit={(e) => sendData(e)}>
                        <TextInput
                            mb={30}
                            error={errors.companyName}
                            label='Nazwa firmy'
                            value={form.companyName}
                            onChange={(e) => setForm({companyName: e.target.value})}
                        />
                        <Group grow>
                            <Button type="submit" loading={sendingData} disabled={anyError || !form.companyName.length} radius='xl' leftIcon={<Edit size={20}/>}>Zmień nazwę firmy</Button>
                        </Group>
                    </form>
                </Group>
            </Container>
        </>
    )
}