import {NextFunction, Request, Response} from 'express';
import {register, login} from '../../src/controllers/auth.controller';
import User from '../../src/models/user.model';
import jwt from 'jsonwebtoken';
import {authMiddleware} from '../../src/middlewares/auth.middleware';
import {appConfig} from '../../src/config/app.config';

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
      mockRequest = {
        ...mockRequest,
        path: '/v1/register',
        body: {
          data: {
            type: 'users',
            attributes: {
              username: 'testuser',
              email: 'test@example.com',
              password: 'Password123!',
            },
          },
        },
      };

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

    // Test for v2 registration endpoint
    it('should register a new user successfully with birthCity for v2', async () => {
      mockRequest = {
        ...mockRequest,
        path: '/v2/register',
        body: {
          data: {
            type: 'users',
            attributes: {
              username: 'testuser',
              email: 'test@example.com',
              password: 'Password123!',
              birthCity: 'New York',
            },
          },
        },
      };

      const mockUser = {
        _id: 'mockedUserId',
        username: 'testuser',
        email: 'test@example.com',
        birthCity: 'New York',
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
            birthCity: 'New York',
          },
        },
      });
    });

    it('should return 400 for invalid input', async () => {
      mockRequest = {
        ...mockRequest,
        path: '/v1/register',
        body: {
          data: {
            type: 'users',
            attributes: {
              username: 'te', // Too short
              email: 'invalidemail',
              password: 'short', // Too short and missing number and special character
            },
          },
        },
      };

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

  it('should fail registration for v2 without birthCity', async () => {
    mockRequest = {
      ...mockRequest,
      path: '/v2/register',
      body: {
        data: {
          type: 'users',
          attributes: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'Password123!',
            // birthCity is missing
          },
        },
      },
    };

    await register(mockRequest as Request, mockResponse as Response);

    expect(responseObject.status).toHaveBeenCalledWith(400);
    expect(responseObject.json).toHaveBeenCalledWith({
      errors: [
        {
          status: '400',
          title: 'Validation Error',
          detail: 'Required',
          source: {
            pointer: '/data/attributes/birthCity',
          },
        },
      ],
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

  describe('AuthMiddleware', () => {
    //Mock Express request, response, and next function
    const mockRequest = () => {
      const req: Partial<Request> = {};
      req.headers = {};
      return req as Request;
    };

    const mockResponse = () => {
      const res: Partial<Response> = {};
      res.status = jest.fn().mockReturnThis();
      res.json = jest.fn().mockReturnThis();
      return res as Response;
    };

    const mockNext: NextFunction = jest.fn();

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return 401 if no token is provided', () => {
      const req = mockRequest();
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          {
            status: '401',
            title: 'Authentication Error',
            detail: 'No token provided',
          },
        ],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if an invalid token is provided', () => {
      //validate this test
      const req = mockRequest();
      req.headers['authorization'] = 'Bearer invalidtoken';
      const res = mockResponse();

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authMiddleware(req, res, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(
        'invalidtoken',
        appConfig.jwtSecret,
      );
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          {
            status: '403',
            title: 'Authorization Error',
            detail: 'Invalid token',
          },
        ],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if token is expired', () => {
      const req = mockRequest();
      const expiredToken = jwt.sign({id: '123'}, appConfig.jwtSecret, {
        expiresIn: '0s',
      });
      req.headers['authorization'] = `Bearer ${expiredToken}`;
      const res = mockResponse();

      authMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          {
            status: '403',
            title: 'Authorization Error',
            detail: 'Invalid token',
          },
        ],
      });
    });
  });
});
