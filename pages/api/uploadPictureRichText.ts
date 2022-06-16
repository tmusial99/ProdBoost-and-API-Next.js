import { NextApiRequest, NextApiResponse } from "next"
import multiparty from 'multiparty'
import { unlink } from "fs"
import sharp from "sharp"
import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3"
import s3client from "../../lib/s3client"

function getRandomInt(min:number, max:number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

export const config = {
    api:{
        bodyParser: false
    }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        const form = new multiparty.Form()
        const data = await new Promise<{fields: any, files: any}>((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if(err) reject(err);
                resolve({fields, files});
            })
        })
        
        const image: File & {path: string} = data.files.image[0];

        const bufferToUpload = await sharp(image.path)
        .resize({
            width: 1000,
            height: undefined,
            withoutEnlargement: true
        })
        .webp()
        .toBuffer()

        try{
            unlink(image.path, (err) => {
                if(err) throw new Error()
            })
        }
        catch(err){
            return res.status(500).json('unlink image error')
        }

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
            return res.status(200).json(urlToPicture)
        }
        catch(e){
            s3client.destroy()
            return res.status(500).json('s3 bucket error');
            
        }
    }
    else{
        res.status(500).json('Route not valid')
    }
}
