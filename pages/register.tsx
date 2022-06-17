import { Box, Button, Group, Loader, LoadingOverlay, PasswordInput, Popover, Progress, Stepper, Text, TextInput } from "@mantine/core";
import { useDebouncedValue, useSetState } from "@mantine/hooks";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, X } from "tabler-icons-react";
import Navbar from "../components/Navbar";
import { isItName, transofrmNameOnBlur } from "../lib/inputHelpers";
import useFormValidation from "../lib/useFormValidation";
import { AxiosError } from "axios";
import axios from "../lib/axios"
import Head from "../components/Head";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session = await getSession(ctx)
    if(session){
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false
            }
        }
    }

    return {props: {}}
}

export default function Register(){
    const [active, setActive] = useState(0);
    const nextStep = () => setActive((current) => (current < 3 ? current + 1 : current));

    const [allValues, setAllValues] = useSetState({})

    return (
        <>
            <Head title='ProdBoost - Rejestracja'/>
            <Navbar/>
            <Group px={20} grow={true} sx={{maxWidth:1000}} mx='auto'>
                <Stepper active={active} onStepClick={setActive} breakpoint={515} pb={20} mt='lg'>
                    <Stepper.Step label="Dane logowania" allowStepSelect={false} >
                        <Group position='center' align='flex-start' grow={true} sx={{width:'100%'}}>
                            <CreateAccount nextStep={nextStep} setGlobalState={setAllValues}/>
                        </Group>
                    </Stepper.Step>
                    <Stepper.Step label="Jak się nazywasz?" allowStepSelect={false}>
                        <Group position='center' align='flex-start' grow={true} sx={{width:'100%'}}>
                            <WhatsYourName nextStep={nextStep} setGlobalState={setAllValues}/>
                        </Group>
                    </Stepper.Step>
                    <Stepper.Step label="Informacje o firmie" allowStepSelect={false}>
                        <Group position='center' align='flex-start' grow={true} sx={{width:'100%'}}>
                            <CompanyDetails nextStep={nextStep} globalState={allValues} setGlobalState={setAllValues}/>
                        </Group>
                    </Stepper.Step>
                    <Stepper.Completed>
                        <Text variant="gradient" gradient={{from: '#0093E9', to: '#80D0C7', deg: 1}} style={{
                            fontSize:'50px', 
                            fontWeight: 900, 
                            textAlign: 'center'
                        }}>
                            Udało się!
                        </Text>
                        <Group direction="column" position="center">
                            <Text>Możesz się teraz zalogować.</Text>
                            <Link href='/dashboard'>
                                <Button component="a" href="/dashboard">Zaloguj</Button>
                            </Link>
                        </Group>
                    </Stepper.Completed>
                </Stepper>
            </Group>
        </>
    )
}

function CreateAccount(props: { nextStep: () => void; setGlobalState:any }){
    const [form, setForm] = useSetState({
        username: '',
        password: '',
        confirmPassword:''
    })
    const [debouncedUsername] = useDebouncedValue(form.username, 600);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameValid, setUsernameValid] = useState(false);
    const {errors, anyError, setErrors} = useFormValidation(form, {
        username: {
            required: true,
            minLength: [6, 'Nazwa użytkownika musi mieć minimalnie 6 znaków.'],
            maxLength: [25, 'Nazwa użytkownika musi mieć maksymalnie 25 znaków.'],
            regex: [/^[a-zA-Z0-9]+$/, 'Niepoprawne znaki.']
        },
        password:{
            required: true
        },
        confirmPassword:{
            required: true,
            equals: [form.password, 'Hasła się nie zgadzają.']
        }
    })

    const usernameIcon = () => {
        if(!form.username.length) return null
        if(!errors.username && checkingUsername) return <Loader size='xs'/>
        if(!checkingUsername && usernameValid) return <Check color='green'/>
        if(errors.username) return <X color='red'/>
    }

    useEffect(() => {
        if(form.username.length !== 0){
            setUsernameValid(false);
            setCheckingUsername(true);
        } 
    }, [form.username])

    useEffect(() => {
        async function CheckUsername(){
            setCheckingUsername(true);
            if(debouncedUsername && !errors.username){
                let x;
                try{
                    const res = await axios.post(`/api/account/checkUsername`, {
                        username: debouncedUsername
                    })
                    res.data === 'Valid' ? x = true : x = false; 
                }
                catch(e){
                    const error = e as AxiosError;
                    if(error.response?.data === 'Network error') x = 'Network error';
                }
                
                switch(x){
                    case true:
                        setUsernameValid(true);
                        break;
                    case false:
                        setErrors({...errors, username:'Nazwa użytkownika jest już zajęta.'})
                        setUsernameValid(false);
                        break;
                    case 'Network error':
                        setErrors({...errors, username:'Błąd połączenia ze serwerem. Spróbuj zarejestrować się później.'})
                        setUsernameValid(false);
                        break;
                }
                setCheckingUsername(false);
            }
        }
        CheckUsername()
    },[debouncedUsername])

    return(
        <Box mt={20} sx={{maxWidth:400, width:'100%'}}>
            <form onSubmit={(e) => {
                e.preventDefault();
                props.nextStep(); 
                props.setGlobalState((current:any) => ({...current, username: form.username, password: form.password }))
            }}>
                <TextInput
                mb={18}
                disabled={false}
                spellCheck={false}
                label='Nazwa użytkownika'
                rightSection={usernameIcon()}
                error={errors.username}
                value={form.username}
                onChange={(e) => {
                    setForm({username: e.currentTarget.value})
                }}/>

                <PasswordStrength label="Hasło" form={form} setForm={setForm} errors={errors} setErrors={setErrors}/>

                <PasswordInput
                disabled={false}
                mt='sm'
                label='Potwierdź hasło'
                error={errors.confirmPassword}
                value={form.confirmPassword}
                onChange={(e) => setForm({confirmPassword: e.currentTarget.value})}/>

                <Group mt={30} mb={30} position='center' grow>
                    <Button radius='xl'type='submit' disabled={anyError || checkingUsername || !usernameValid} loading={false}>Dalej</Button>
                </Group>
            </form>
        </Box>
    )
}


export function PasswordStrength({form, setForm, errors, setErrors, label}: any) {
    function PasswordRequirement({ meets, label }: { meets: boolean; label: string }) {
        return (
            <Text
            color={meets ? 'teal' : 'red'}
            sx={{ display: 'flex', alignItems: 'center' }}
            mt={7}
            size="sm"
            >
            {meets ? <Check/> : <X/>} <Box ml={10}>{label}</Box>
            </Text>
        );
    }

    const requirements = [
        { re: /[0-9]/, label: 'Zawiera liczbę' },
        { re: /[a-z]/, label: 'Zawiera małą literę' },
        { re: /[A-Z]/, label: 'Zawiera wielką literę' },
        { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Zawiera znak specjalny ( ! ? @ % ...)' },
    ];
    
    function getStrength(password: string) {
        let multiplier = password.length > 5 && password.length < 21 ? 0 : 1;
    
        requirements.forEach((requirement) => {
            if (!requirement.re.test(password)) {
                multiplier += 1;
            }
        });
    
        return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
    }


    const [popoverOpened, setPopoverOpened] = useState(false);
    const checks = requirements.map((requirement, index) => (
        <PasswordRequirement key={index} label={requirement.label} meets={requirement.re.test(form.password)} />
    ));

    const strength = getStrength(form.password);
    const color = strength === 100 ? 'teal' : strength > 50 ? 'yellow' : 'red';

    useEffect(() => {
        if(strength === 100 || form.password.length===0) setErrors((current: any) => ({...current, password: null}))
        else setErrors((current: any) => ({...current, password: ' '}))
    },[strength])

    return (
        <Popover
        opened={popoverOpened}
        position="bottom"
        placement="start"
        withArrow
        style={{width:'100%'}}
        trapFocus={false}
        transition="pop-top-left"
        onFocusCapture={() => setPopoverOpened(true)}
        onBlurCapture={() => setPopoverOpened(false)}
        target={
            <PasswordInput
            label={label}
            error={errors.password}
            value={form.password}
            onChange={(event) => setForm({password: event.currentTarget.value})}
            />
        }
        >
            <Progress color={color} value={strength} size={5} style={{ marginBottom: 10 }} />
            <PasswordRequirement label="Od 6 do 25 znaków" meets={form.password.length < 26 && form.password.length > 5} />
            {checks}
        </Popover>
    );
}

function WhatsYourName(props: { nextStep: () => void, setGlobalState: any}){
    const [form, setForm] = useSetState({
        firstName: '',
        surname: ''
    });
    const {errors, anyError} = useFormValidation(form, {
        firstName:{
            required: true,
            minLength: [2, 'Imię musi mieć minimalnie 2 znaki.'],
            maxLength: [25, 'Imię musi mieć maksymalnie 25 znaków.']
        },
        surname:{
            required: true,
            minLength: [2, 'Nazwisko musi mieć minimalnie 2 znaki.'],
            maxLength: [25, 'Nazwisko musi mieć maksymalnie 25 znaków.']
        }
    })
    
    return(
        <Box mt={20} sx={{maxWidth:400, width:'100%'}}>
            <form onSubmit={(e) => {
                e.preventDefault()
                props.nextStep(); 
                props.setGlobalState((current: any) => ({...current, ...form}));
            }}>
                <TextInput
                mb={18}
                disabled={false}
                spellCheck={false}
                label='Imię'
                error={errors.firstName}
                value={form.firstName}
                onKeyDown={(e) => {
                    if(e.key === 'Enter'){
                        let value = transofrmNameOnBlur(e.currentTarget.value);
                        setForm({firstName: value})
                    }
                }}
                onBlur={(e) => {
                    let value = transofrmNameOnBlur(e.target.value);
                    setForm({firstName: value})
                }}
                onChange={(e) => {
                    const value = e.target.value
                    if(!isItName(value) && value.length !== 0) return;

                    setForm({firstName: value})
                }}/>

                <TextInput
                mb={18}
                disabled={false}
                spellCheck={false}
                label='Nazwisko'
                error={errors.surname}
                value={form.surname}
                onKeyDown={(e) => {
                    if(e.key === 'Enter'){
                        let value = transofrmNameOnBlur(e.currentTarget.value);
                        setForm({surname: value})
                    }
                }}
                onBlur={(e) => {
                    let value = transofrmNameOnBlur(e.target.value);
                    setForm({surname: value})
                }}
                onChange={(e) => {
                    const value = e.target.value
                    if(!isItName(value) && value.length !== 0) return;

                    setForm({surname: value})
                }}/>

                <Group mt={30} mb={30} position='center' grow>
                    <Button radius='xl' type='submit' disabled={anyError} loading={false}>Dalej</Button>
                </Group>
            </form>
        </Box>
    )
}

function CompanyDetails(props: { nextStep: () => void, setGlobalState: any, globalState: object}){
    const [form, setForm] = useSetState({
        companyName: ''
    });
    const {errors, anyError} = useFormValidation(form, {
        companyName:{
            required: true,
            minLength: [3, 'Nazwa firmy musi mieć minimalnie 3 znaki.'],
            maxLength: [25, 'Nazwa firmy musi mieć maksymalnie 25 znaków.']
        }
    })
    const [sendingData, setSendingData] = useState(false);

    return(
        <Box mt={20} sx={{maxWidth:400, width:'100%'}}>
            <form onSubmit={async (e) => {
                e.preventDefault();
                setSendingData(true);
                const data = {...props.globalState, ...form}
                try{
                    await axios.post('/api/account/signup', data)
                }
                catch(ex:any){
                    setSendingData(false);
                    return;
                }
                setSendingData(false);
                props.nextStep(); 
                
            }}>
                <LoadingOverlay visible={sendingData} sx={{position: 'fixed'}}/>
               
                <TextInput
                mb={18}
                disabled={false}
                spellCheck={false}
                label='Nazwa firmy'
                error={errors.companyName}
                value={form.companyName}
                onChange={(e) => {
                    setForm({companyName: e.target.value})
                }}/>

                <Group mt={30} mb={30} position='center' grow>
                    <Button radius='xl' type='submit' disabled={anyError || sendingData} loading={false}>Dalej</Button>
                </Group>
            </form>
        </Box>
    )
}
  