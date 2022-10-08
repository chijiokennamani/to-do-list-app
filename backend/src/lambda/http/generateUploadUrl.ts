import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { getUploadUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('updateTodo')


export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    try {
      logger.info("Now calling getUploadUrl for todoid:",todoId,"for user",getUserId(event))
      const url = await getUploadUrl(todoId,getUserId(event));
      return {
        statusCode: 201,
        body: JSON.stringify({
          "uploadUrl": url
        })
      }
    } catch (e) {
      console.log(e)
      return {
        statusCode: e.status || 500,
        body: JSON.stringify({
          error: `Failed to get upload Url due to: ${e}`
        })
      }
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
