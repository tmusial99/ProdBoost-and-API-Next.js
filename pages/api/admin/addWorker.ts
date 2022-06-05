import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {firstName, surname, permissions}: {firstName: string, surname: string, permissions: string[]} = req.body;
        if(!firstName || !surname || 
            firstName.length > 25 || firstName.length < 2 ||
            surname.length > 25 || surname.length < 2 || permissions.length===0){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session || session.user.role !== 'CompanyOwner'){
            res.status(401).json('unauthorized');
            return;
        }

        let randomUserData = generateRandomUserData(firstName, surname);
        let isUsernameValid = false;

        const {client, db} = await getDatabase()

        while(!isUsernameValid){
            const user = await db.collection('users').findOne({username: randomUserData})
            if(user){
                isUsernameValid = false;
                randomUserData = generateRandomUserData(firstName, surname);
            }
            else{
                isUsernameValid = true;
            }
        }

        const newUserId = await db.collection('users').insertOne({
            username: randomUserData,
            initialPassword: randomUserData,
            passwordWarning: true,
            firstName: firstName,
            surname: surname,
            role: 'Worker',
            permissions: permissions,
            companyId: new ObjectId(session.user.companyId)
        })   

        await client.close();

        res.status(200).json({_id: newUserId.insertedId, firstName: firstName, surname: surname});
    }
    else{
        res.status(500).json('Route not valid');
    }
}

function generateRandomUserData(firstName:string, surname:string){
    const firstPart = firstName.substring(0, 3).toLowerCase();
    const secondPart = surname.substring(0, 3).toLowerCase();
    const thirdPart = getRandomInt(100, 1000);

    return firstPart + secondPart + thirdPart;
}

function getRandomInt(min:number, max:number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }