import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { NextApiRequest, NextApiResponse } from "next";
import sharp from 'sharp'
import s3client from "../../lib/s3client";

function getRandomInt(min:number, max:number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

export const config = {
    api:{
        bodyParser:{
            sizeLimit: '10mb'
        }
    }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const {image}: {image: number[]} = req.body
        
        if(!image){
            res.status(400).json('invalid data');
            return;
        }
        
        const bufferToUpload = await sharp(new Uint8Array(image))
            .resize({
                width: 1000,
                height: undefined,
                withoutEnlargement: true
            })
            .webp()
            .toBuffer()


        const params: PutObjectCommandInput = {
            Bucket: 'prodboost',
            Key: `richText_images/${Date.now()}${getRandomInt(100,1000)}.webp`,
            ContentType: 'image/webp',
            Body: bufferToUpload
        }
        const urlToPicture = `https://prodboost.s3.eu-central-1.amazonaws.com/${params.Key}`;
        
        try{
            await s3client.send(new PutObjectCommand(params));
            s3client.destroy();
        }
        catch(e){
            s3client.destroy()
            res.status(500).json('s3 bucket error');
            return;
        }

        res.status(200).json(urlToPicture)
        return;
    }
    else{
        res.status(500).json('Route not valid');
    }
}