import { Box, Button, Center, Divider, Group, Modal, Overlay, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { CheckIcon } from "@modulz/radix-icons";
import { WithId } from "mongodb";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useState } from "react";
import { Minus, Plus, Upload } from "tabler-icons-react";
import axios from "../lib/axios";
import { IMaterial } from "../types/items";
import NumberInputPositiveInt from "./NumberInputPositiveInt";

type Props = {
    variant: 'materials' | 'components' | 'products' | 'packing' | 'orders', 
    openModalState: [boolean, Dispatch<SetStateAction<boolean>>],
    component: WithId<any>,
    setComponent: Dispatch<SetStateAction<WithId<any>>>,
    setForm: any
}

export default function EditQuantityModal({variant, openModalState, component, setComponent, setForm}: Props){
    const [currentQuantity, setCurrentQuantity] = useState(!!component.quantity ? component.quantity : 0)
    const [plus, setPlus] = useState<number | undefined>();
    const [minus, setMinus] = useState<number | undefined>();

    const [sendingData, setSendingData] = useState(false);

    const sendData = async () => {
        setSendingData(true)
        try{
            const res = await axios.post(`/api/${variant}/editQuantity`, {quantity: !!plus ? currentQuantity + plus : (!!minus ? currentQuantity - minus : currentQuantity), componentId: component._id.toString()})
            setForm({quantity: res.data})
            openModalState[1](false);
            setPlus(undefined)
            setMinus(undefined)
            setCurrentQuantity(res.data)
            setComponent((curr: any) => ({...curr, quantity: res.data}))
            setSendingData(false)
            showNotification({
                title: 'Udało się!',
                message: (
                    variant === 'materials' ? ('Poprawnie zapisano ilość materiału.') :
                    variant === 'components' ? ('Poprawnie zapisano ilość komponentu.') :
                    variant === 'products' ? ('Poprawnie zapisano ilość produktu.') :
                    variant === 'packing' ? ('Poprawnie zapisano ilość opakowań.') :
                    variant === 'orders' && ('Poprawnie zapisano ilość zamówienia.')
                ),
                icon: <CheckIcon/>,
                autoClose: 8000,
                radius: 'lg',
                color: 'green'
            })
        }
        catch(e){
            console.log(e)
            setSendingData(false)
        }
    }

    return(
        <Modal
            opened={openModalState[0]}
            onClose={() => {
                setPlus(undefined);
                setMinus(undefined);
                openModalState[1](false);
            }}
            withCloseButton={!sendingData}
            title={<Text weight={700}>Dodaj lub odejmij</Text>}
            centered
        >
            <Box mb={10}>
                <Text>{`Aktualna ilość: ${currentQuantity}`}</Text>
                {!!plus && (<Text>{`Po dodaniu: ${currentQuantity + Math.floor(plus)}`}</Text>)}
                {!!minus && (<Text>{`Po odjęciu: ${minus > currentQuantity ? 0 : (currentQuantity - Math.floor(minus))}`}</Text>)}
            </Box>
            
            <Group spacing={0} noWrap>
                <Group sx={{position: 'relative'}} p={15}>
                    {!!minus && <Overlay opacity={0.5} color="#000" radius='md'/>}
                    <Box mx='auto'>
                        <Plus size={60}/>
                    </Box>
                    <NumberInputPositiveInt aria-label="Dodaj liczbę" disabled={!!minus} value={plus} min={1} max={9_999_999} onChange={(value) => {
                        if(!isNaN(value as number)) value as number  > 9_999_999 ? setPlus(9_999_999) : setPlus(value)
                        else setPlus(undefined)
                    }}/>
                </Group>
                
                <Group sx={{alignSelf: 'stretch'}} mx={10}>
                    <Divider orientation="vertical" size='md'/>
                </Group>
           
                <Group sx={{position: 'relative'}} p={15}>
                    {(!!plus || currentQuantity === 0) && <Overlay opacity={0.5} color="#000" radius='md'/>}
                    <Box mx='auto'>
                        <Minus size={60}/>
                    </Box>
                    <NumberInputPositiveInt aria-label="Odejmij liczbę" disabled={!!plus} value={minus} min={1} max={currentQuantity} onChange={(value) => {
                        if(!isNaN(value as number)) value as number > currentQuantity ? setMinus(currentQuantity) : setMinus(value)
                        else setMinus(undefined)
                    }}/>
                </Group>
            </Group>

            <Center mt={30}>
                <Button disabled={!plus && !minus} leftIcon={!!plus || !!minus ? <Upload size={20}/> : null} loading={sendingData} onClick={() => sendData()}>
                    {!plus && !minus && ('Wpisz wartość')}
                    {!!plus && ('Dodaj i zapisz')}
                    {!!minus && ('Odejmij i zapisz')}
                </Button>
            </Center>
        </Modal>
    )
}