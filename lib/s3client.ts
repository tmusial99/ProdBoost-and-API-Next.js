import { S3Client } from "@aws-sdk/client-s3"

const REGION = "eu-central-1";
const s3client = new S3Client({region: REGION})
export default s3client