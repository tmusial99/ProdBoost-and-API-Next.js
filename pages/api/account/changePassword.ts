import { compare, hash } from "bcryptjs";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import getDatabase from "../../../lib/getDatabase";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {actualPassword, password} = req.body;
        if(
            (!actualPassword || actualPassword.length>25 || actualPassword.length<6) ||
            (!password || password.length>25 || password.length<6) ||
            (password === actualPassword)
        ){
            res.status(400).json('invalid data'); 
            return;
        }

        const session = await getSession({req})
        if(!session){
            res.status(401).json('unauthorized');
            return;
        }

        const {client, db} = await getDatabase()
        const user = await db.collection('users').findOne({_id: new ObjectId(session.user._id)})
        const isPasswordCorrect = await compare(actualPassword, user?.hashedPassword)
        if(!isPasswordCorrect){
            client.close()
            res.status(400).json('invalid password');
            return;
        }

        const response = await db.collection('users').updateOne(
            {...user},
            {$set: {hashedPassword: await hash(password, 12)}}    
        )

        client.close();

        response ? res.status(200).json('success') : res.status(400).json('error');
    }
    else{
        res.status(500).json('Route not valid');
    }
}

//TODO: sprawdzić jeszcze czy hasło z req jest takie samo jak te z mongodb