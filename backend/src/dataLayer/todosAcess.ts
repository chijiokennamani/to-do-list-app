import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import { getAttachmentUrl, getSignedUploadUrl } from '../fileStorage/attachmentUtils';
const AWSXRay = require('aws-xray-sdk') 

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

const docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const todosByUserIndex = process.env.TODOS_BY_USER_INDEX

  export  async function getTodosForUser(userId: string): Promise<TodoItem[]> {
      logger.info('Getting all todo items for '+ userId)
  
      const result = await docClient.query({
        TableName: todosTable,
      IndexName: todosByUserIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
      }).promise()
  
      const items = result.Items
      return items as TodoItem[]
    }
  
    export async function createTodo(todo: TodoItem): Promise<TodoItem> {
      await docClient.put({
        TableName: todosTable,
        Item: todo
      }).promise()
      logger.info(`Todo item ${todo.todoId} was created`)
      return todo
    }

    export async function updateTodo(
      userId: string,
      todoId: string,
      todoUpdate: TodoUpdate
    ): Promise<void> {
      await docClient
        .update({
          TableName: todosTable,
          Key: {
            userId: userId,
            todoId: todoId
          },
          UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
          ExpressionAttributeNames: {
            '#name': 'name'
          },
          ExpressionAttributeValues: {
            ':name': todoUpdate.name,
            ':dueDate': todoUpdate.dueDate,
            ':done': todoUpdate.done
          }
        })
        .promise()
    
      logger.info(`Todo item ${todoId} was updated`)
    }

    export async function deleteTodo(userId: string, todo: string): Promise<void> {

      await docClient.delete({
        TableName: todosTable,
        Key: {
          todoId: todo,
          userId: userId
      }
      }).promise()
      logger.info(`Todo ${todo} was deleted`)
    }

    export async function updateUrlInDB(
      todoId: string,
      userId: string,
      attachmentUrl: string
    ): Promise<void> {
      await docClient
        .update({
          TableName: todosTable,
          Key: {
            todoId:todoId,
            userId:userId
          },
          UpdateExpression: 'set attachmentUrl = :attachmentUrl',
          ExpressionAttributeValues: {
            ':attachmentUrl': attachmentUrl
          }
        })
        .promise()
    
      logger.info(`Attachment URL for todo ${todoId} was updated`)
    }
    
    export async function getTodoItem(todoId: string): Promise<TodoItem> {
      const result = await docClient
        .get({
          TableName: todosTable,
          Key: {
            todoId
          }
        })
        .promise()
    
      const item = result.Item
    
      logger.info(`Todo item ${item} was fetched`)
    
      return item as TodoItem
    }

    export async function todoExists(todoId: string, userId: string) {
      const result = await docClient
          .get({
              TableName: todosTable,
              Key: {
                  userId:userId,
                  todoId:todoId
              }
          })
          .promise()

      return !!result.Item

  }

  export async function getUploadUrl(imageId: string) {
      return getSignedUploadUrl(imageId)
  }

  export async function generateUploadUrl(todoId: string, imageId: string, userId: string): Promise<string> {

    logger.info("Initiating url update for todoId",todoId)
    const attachmentUrl = getAttachmentUrl(todoId)
    await docClient
      .update({
        TableName: todosTable,
        Key: { userId:userId, todoId:todoId },
        ConditionExpression: 'attribute_exists(todoId)',
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        }
      })
      .promise();

    const url = getUploadUrl(imageId);
    return url;
}