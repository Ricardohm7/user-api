import {Request, Response} from 'express';
import {register} from '../../src/controllers/auth.controller'; // Adjust the import path as needed
import User from '../../src/models/user.model'; // Adjust the import path as needed

// Mock the User model
jest.mock('../../src/models/user.model');
jest.mock('jsonwebtoken');

describe('Authentication Controller (JSON:API Compliant)', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    responseObject = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    mockResponse = responseObject;
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        data: {
          type: 'users',
          attributes: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'Password123!',
          },
        },
      };
      mockRequest.body = userData;

      const mockUser = {
        _id: 'mockedUserId',
        username: 'testuser',
        email: 'test@example.com',
        save: jest.fn().mockResolvedValue(true),
      };

      (User as jest.MockedClass<typeof User>).mockImplementation(
        () => mockUser as any,
      );

      await register(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(201);
      expect(responseObject.json).toHaveBeenCalledWith({
        data: {
          type: 'users',
          id: 'mockedUserId',
          attributes: {
            username: 'testuser',
            email: 'test@example.com',
          },
        },
      });
    });
  });
});
