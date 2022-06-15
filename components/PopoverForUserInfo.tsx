import { Group, Popover, Text } from "@mantine/core";
import dayjs from "dayjs";
import { useState } from "react";
import { CalendarTime, InfoCircle } from "tabler-icons-react";

export default function PopoverForUserInfo({creator, createdAt}: {creator: string, createdAt: number}){
    const [opened, setOpened] = useState(false);
    return(
        <Popover
            opened={opened}
            onClose={() => setOpened(false)}
            position='bottom'
            placement='center'
            withArrow
            trapFocus={false}
            closeOnEscape={false}
            transition="pop-top-left"
            styles={{ body: { pointerEvents: 'none' } }}
            target={
              <Group onMouseEnter={() => setOpened(true)} onMouseLeave={() => setOpened(false)}>
                <InfoCircle/>
              </Group>
            }
        >
            <Text weight='bold'>Utworzone przez:</Text>
            <Text>{creator}</Text>
            <Group position='left' spacing={10} mt={15}>
                <CalendarTime size={15}/>
                <Text color='dimmed'>{dayjs(createdAt).format('DD.M.YYYY | HH:mm')}</Text>
            </Group>
        </Popover>
    )
}