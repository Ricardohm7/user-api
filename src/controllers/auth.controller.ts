import {z} from 'zod';
import User from '../models/user.model';
import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {appConfig} from '../config/app.config';

const UserSchemav1 = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[0-9])(?=.*[!@#$%^&*])/,
      'Password must include at least 1 number and 1 special character',
    ),
});

const UserSchemaV2 = UserSchemav1.extend({
  birthCity: z.string(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const version = req.path.split('/')[1]; // Assumes path is like '/v1/register' or '/v2/register'
    const UserSchema = version === 'v2' ? UserSchemaV2 : UserSchemav1;

    const validatedData = UserSchema.parse(req.body.data.attributes);

    const user = new User(validatedData);
    await user.save();

    res.status(201).json({
      data: {
        type: 'users',
        id: user._id,
        attributes: {
          username: user.username,
          email: user.email,
          ...(version === 'v2' && {birthCity: user.birthCity}),
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map((err) => ({
        status: '400',
        title: 'Validation Error',
        detail: err.message,
        source: {pointer: `/data/attributes/${err.path.join('/')}`},
      }));
      res.status(400).json({errors: validationErrors});
    } else {
      res.status(500).json({
        errors: [
          {
            status: '500',
            title: 'Server Error',
            detail: 'An unexpected error occurred',
          },
        ],
      });
    }
  }
};

const LoginSchema = z.object({
  data: z.object({
    attributes: z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    }),
  }),
});

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const {email, password} = validatedData.data.attributes;
    const user = await User.findOne({email});
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({
        errors: [
          {
            status: '401',
            title: 'Authentication Failed',
            detail: 'Invalid email or password',
          },
        ],
      });
    }

    const accessToken = jwt.sign({userId: user._id}, appConfig.jwtSecret, {
      expiresIn: '15m',
    });

    // Generate refresh token
    const refreshToken = jwt.sign(
      {userId: user._id},
      appConfig.jwtRefreshToken,
      {expiresIn: '7d'}, // Long-lived token
    );

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      data: {
        type: 'tokens',
        id: user._id,
        attributes: {
          accessToken,
        },
        relationships: {
          user: {
            data: {
              type: 'users',
              id: user._id,
            },
          },
        },
      },
      included: [
        {
          type: 'users',
          id: user._id,
          attributes: {
            username: user.username,
          },
        },
      ],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      const validationErrors = error.errors.map((err) => ({
        status: '400',
        title: 'Validation Error',
        detail: err.message,
        source: {pointer: `/data/attributes/${err.path.join('/')}`},
      }));
      res.status(400).json({errors: validationErrors});
    } else {
      // Handle other errors
      res.status(500).json({
        errors: [
          {
            status: '500',
            title: 'Server Error',
            detail: 'An unexpected error occurred',
          },
        ],
      });
    }
  }
};
