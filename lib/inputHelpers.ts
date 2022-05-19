export function isItName(value: string){
    const regex1 = /^[\p{L}\s.'-]+$/u
    const regex2 = /[\s'.-][\s'.-]/
    
    if(!regex1.test(value)) return false;
    if(regex2.test(value)) return false;

    return true;
}

export function transofrmNameOnBlur(value: string){
    let name = value;
    const illegalCharsAtTheEnd = [' ', "'", '-', '.']

    if(name.length>0){
        if(illegalCharsAtTheEnd.includes(name[0])){
            name = name.substring(1);
        }

        name = name[0].toUpperCase() + name.slice(1);

        if(illegalCharsAtTheEnd.includes(name[name.length - 1])){
            name = name.slice(0, -1);
        }
    }

    return name;
}