import {Request, Response} from 'express';
import {register, login} from '../../src/controllers/auth.controller';
import User from '../../src/models/user.model';
import jwt from 'jsonwebtoken';

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

    it('should return 400 for invalid input', async () => {
      const userData = {
        data: {
          type: 'users',
          attributes: {
            username: 'te', // Too short
            email: 'invalidemail',
            password: 'short', // Too short and missing number and special character
          },
        },
      };
      mockRequest.body = userData;

      await register(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(400);
      expect(responseObject.json).toHaveBeenCalledWith({
        errors: expect.arrayContaining([
          expect.objectContaining({
            status: '400',
            title: 'Validation Error',
            detail: expect.any(String),
            source: expect.objectContaining({
              pointer: expect.stringMatching(/^\/data\/attributes\//),
            }),
          }),
        ]),
      });
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      const loginData = {
        data: {
          type: 'tokens',
          attributes: {
            email: 'test@example.com',
            password: 'Password123!',
          },
        },
      };
      mockRequest.body = loginData;

      const mockUser = {
        _id: 'mockedUserId',
        username: 'testuser',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mockedToken');

      await login(mockRequest as Request, mockResponse as Response);

      expect(responseObject.json).toHaveBeenCalledWith({
        data: {
          type: 'tokens',
          id: 'mockedUserId',
          attributes: {
            accessToken: 'mockedToken',
          },
          relationships: {
            user: {
              data: {type: 'users', id: 'mockedUserId'},
            },
          },
        },
        included: [
          {
            type: 'users',
            id: 'mockedUserId',
            attributes: {
              username: 'testuser',
            },
          },
        ],
      });
      expect(responseObject.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mockedToken',
        expect.any(Object),
      );
    });
  });
});
