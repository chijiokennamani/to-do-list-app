import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger'

const logger = createLogger('create To-do')

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the fileStogare logic
const s3 = new XAWS.S3({ signatureVersion: 'v4' })
const bucketName = process.env.ATTACHMENT_S3_BUCKET

export function getAttachmentUrl(attachmentId: string): string {
    return `https://${bucketName}.s3.amazonaws.com/${attachmentId}`
  }

  export function getSignedUploadUrl(attachmentId: string){

    logger.info("fetching signed url")

    const url = s3.getSignedUrl('putObject',{
      Bucket: bucketName,
      Key: attachmentId,
      Expires: 300
    })
    logger.info("Fetched signed url",url)
return url
  }