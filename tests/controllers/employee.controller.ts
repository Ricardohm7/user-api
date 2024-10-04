// import {NextFunction, Request, Response} from 'express';
// import lwt from 'jsonwebtoken';
// import {authMiddleware} from '../../src/middlewares/auth.middleware';
// import {appConfig} from '../../src/config/app.config';

// describe('AuthMiddleware', ()=>{
//   //Mock Express request, response, and next function
//   const mockRequest = ()=>{
//     const req: Partial<Request> = {},
//     req.headers = {};
//     return req as Request;
//   }

//   const mockResponse = ()=>{
//     const res: Partial<Response> = {};
//     res.status = jest.fn().mockReturnThis();
//     res.json = jest.fn().mockReturnThis();
//     return res as Response;
//   }

//   const mockNext: NextFunction = jest.fn();

//   afterEach(()=>{
//     jest.clearAllMocks();
//   });

//   it('should return 401 if no token is provided', ()=>{
//     const req = mockRequest();
//     const res = mockResponse();

//     authMiddleware(req, res, mockNext);

//     expect(res.status).toHaveBeenCalledWith(401);
//     expect(res.json).toHaveBeenCalledWith({
//       errors: [
//         {
//           status: '401',
//           title: 'Authentication Error',
//           detail: 'No token provided'
//         }
//       ]
//     });
//     expect(mockNext).not.toHaveBeenCalled();
//   })
// })
