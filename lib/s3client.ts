import { S3Client } from "@aws-sdk/client-s3"

const REGION = "eu-central-1";
const s3client = new S3Client({
    region: REGION,
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_PRODBOOST+'',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_PRODBOOST+'' 
    }
})
export default s3client