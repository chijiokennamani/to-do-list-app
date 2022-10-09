import { getTodosForUser,
   createTodo as createTodoListItem,
   updateTodo as updateTodoListItem,
   deleteTodo as deleteTodoListItem,
   generateUploadUrl,
   todoExists} from '../dataLayer/todosAcess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import { parseUserId } from "../auth/utils"
import * as uuid from 'uuid'

// TODO: Implement businessLogic

const logger = createLogger('todos')

export async function getTodos(
  userId: string
): Promise<TodoItem[]> {
    const todos = await getTodosForUser(userId)
    logger.info(`Retrieving to-dos for ${userId} :`, JSON.stringify(todos))
    return todos
  }
  
  export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    jwtToken: string
  ): Promise<TodoItem> {
    
    const todoId = uuid.v4()
    const userId = parseUserId(jwtToken)
    logger.info(`Retrieving to-dos for ${userId} :`)
    return await createTodoListItem({
      todoId: todoId,
          userId: userId,
          name: createTodoRequest.name,
          createdAt: new Date().toISOString(),
          dueDate: createTodoRequest.dueDate,
          done:false,//default behavior
          attachmentUrl: null
    })
  }
  
  export async function updateTodo(
    userId: string,
    todoId: string,
    updateTodoRequest: UpdateTodoRequest
  ): Promise<void> {
    try {
  
      await updateTodoListItem(userId, todoId, updateTodoRequest)
      logger.info(`Updated todo ${todoId} for user ${userId}:`, {
        userId,
        todoId,
        todoUpdate: updateTodoRequest
      })
    } catch (error) {
      if (!error.code) {
        error.code = 500
        error.message = 'Error occurred when updating todo item'
      }
      logger.error(error.message)
      return error
    }
  }

  export async function deleteTodo(
    userId: string,
    todoId: string
  ): Promise<number> {
    try {
  
  
      await deleteTodoListItem(userId,todoId)
  
      logger.info(`Deleting todo ${todoId} for user ${userId}:`, {
        userId,
        todoId
      })
      return 200
    } catch (error) {
      if (!error.code) {
        error.code = 500
        error.message = 'Error occurred when deleting todo item'
      }
      logger.error(error.message)
      return error.code
    }
  }

  export async function getUploadUrl(todoId: string,userId: string
    ): Promise<string> {
        const validTodo = await todoExists(todoId,userId);
        if (!validTodo) {
            throw {
                status: 404,
                error: new Error("TODO does not exist")
            }
        }
        const imageId = uuid.v4();
        return await generateUploadUrl(todoId, imageId, userId);
    }