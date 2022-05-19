import { NextApiRequest, NextApiResponse } from "next";
import getDatabase from "../../../lib/getDatabase";
import { hash } from 'bcryptjs'

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {username, password, firstName, surname, companyName} = req.body;
        if(!username || username.length>25 || username.length<6) res.status(400).json({message: 'Invalid data'});
        if(!password || password.length>25 || password.length<6) res.status(400).json({message: 'Invalid data'});
        if(!firstName || firstName.length>25 || firstName.length<2) res.status(400).json({message: 'Invalid data'});
        if(!surname || surname.length>25 || surname.length<2) res.status(400).json({message: 'Invalid data'});
        if(!companyName || companyName.length>25 || companyName.length<3) res.status(400).json({message: 'Invalid data'});

        const {client, db} = await getDatabase()

        const checkExisting = await db.collection('users').findOne({username: username});
        if(checkExisting){
            client.close();
            res.status(400).json({message: 'Username taken'});
            return;
        }
        const addedCompany = await db.collection('companies').insertOne({
            companyName: companyName
        })
        const status = await db.collection('users').insertOne({
            username: username,
            hashedPassword: await hash(password, 12),
            firstName: firstName,
            surname: surname,
            role: 'CompanyOwner',
            permissions: ['materials', 'components', 'products', 'packing', 'orders'],
            companyId: addedCompany.insertedId
        });
        client.close();
        res.status(201).json({message: 'User created'});
    }
    else{
        res.status(500).json({message: 'Route not valid'});
    }
}