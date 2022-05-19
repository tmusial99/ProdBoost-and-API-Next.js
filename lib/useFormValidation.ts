import { useEffect, useState } from "react";

/*
Useful regex:
/^[a-zA-Z0-9]+$/ : only letters and numbers
...
*/

type ValidationObject = {
    [inputName: string]: {
        minLength?: [value:number, errorMsg:string],
        maxLength?: [value:number, errorMsg:string],
        required?: boolean,
        regex?: [regex: RegExp, errorMsg:string],
        equals?: [inputString:string, errorMsg:string],
    }
}

export default function useFormValidation(formObject: {[inputName:string]: string}, validationObject: ValidationObject){
    let initialErrorsState = {};
    Object.keys(formObject).forEach(element => {
        initialErrorsState = {...initialErrorsState, [element]: null};
    });

    const [prevFormObjectState, setPrevFormObjectState] = useState(formObject);
    const [errors, setErrors] = useState<{[inputName:string]: string | null}>(initialErrorsState);

    const validationArray = Object.entries(validationObject);

    useEffect(() => {
        const array1 = Object.entries(formObject);
        const array2 = Object.entries(prevFormObjectState);
        if(array1 === array2) return;

        setPrevFormObjectState(formObject);
 
        const difference = () => {
            for(let i=0; i<array1.length; i++){
                if(array1[i][1] !== array2[i][1]) return array1[i][0];
            }
        }
        const targetInput = validationArray.filter(x => x[0] === difference())[0];
        
        let requiredFromAllInputs: boolean[] = [];
        validationArray.forEach(element => {
            const allRules = element[1]
            const onlyRequiredRule = allRules.required

            if(onlyRequiredRule){
                const inputCopy = formObject[element[0]]
                if(inputCopy.length === 0) requiredFromAllInputs.push(true);
            }
        })
        requiredFromAllInputs.filter(x=>x).length ? setErrors((current) => ({...current, required: 'error'})) : setErrors((current) => ({...current, required: null}));

        if(!targetInput) return;

        const inputName = targetInput[0];
        const inputCopy = formObject[inputName];
        const rules = targetInput[1];
            
        const minLengthRule = rules.minLength;
        const maxLengthRule = rules.maxLength;
        const regexRule = rules.regex;
        const equalsRule = rules.equals;

        if(regexRule){
            if(regexRule[0].test(inputCopy) || inputCopy.length===0){
                setErrors((current) => ({...current, [inputName]: null}))
            }
            else{
                setErrors((current) => ({...current, [inputName]: regexRule[1]}));
                return;
            }
        }

        if(minLengthRule){
            if(inputCopy.length < minLengthRule[0] && inputCopy.length > 0){
                setErrors((current) => ({...current, [inputName]: minLengthRule[1]}));
                return;
            }
            else{
                setErrors((current) => ({...current, [inputName]: null}));
            }
        }

        if(maxLengthRule){
            if(inputCopy.length > maxLengthRule[0]){
                setErrors((current) => ({...current, [inputName]: maxLengthRule[1]}));
                return;
            }
        }

        if(equalsRule){
            if(equalsRule[0] === inputCopy || inputCopy.length===0){
                setErrors((current) => ({...current, [inputName]: null}));
            }
            else{
                setErrors((current) => ({...current, [inputName]: equalsRule[1]}));
            }
        }
    }, [formObject])

    const anyError =  !!Object.values(errors).filter(x => x).length

    return {errors, setErrors, anyError}
}