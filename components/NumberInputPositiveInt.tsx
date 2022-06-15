import { NumberInput as MantineNumberInput, NumberInputProps } from "@mantine/core";

export default function NumberInputPositiveInt(props: NumberInputProps & React.RefAttributes<HTMLInputElement>){
    return(
        <MantineNumberInput {...props} parser={(value) => {
            const newValue = value?.replace(/\D+/g, '') as string
            return /^[1-9]\d*$/g.test(newValue) ? newValue : ''
        }}/>
    )
}