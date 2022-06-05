import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'GET'){
        
        res.status(200).json('OK');
    }
    else{
        res.status(500).json('Route not valid');
    }
}