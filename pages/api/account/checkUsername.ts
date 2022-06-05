import { NextApiRequest, NextApiResponse } from "next";
import getDatabase from "../../../lib/getDatabase";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {username} = req.body;
        if(!username || username.length>25 || username.length<6) res.status(400).json({message: 'Invalid data'});

        const {client, db} = await getDatabase()

        const checkExisting = await db.collection('users').findOne({username: username});
        await client.close();
        res.status(200).json(checkExisting ? 'Not valid' : 'Valid');
    }
    else{
        res.status(500).json({message: 'Route not valid'});
    }
}