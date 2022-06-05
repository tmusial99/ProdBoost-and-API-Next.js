import { Center, Text } from "@mantine/core";
import dayjs from "dayjs";

export default function Footer(){
    return(
        <footer style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: '50px'
        }}>
            <Center sx={(theme) => ({
                backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2],
                height: '50px'
                
            })}>
                <Text>ProdBoost @{dayjs(Date.now()).year()}</Text>
            </Center>
        </footer>
    )
}