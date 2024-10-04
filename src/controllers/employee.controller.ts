import {Request, Response} from 'express';
import Employee from '../models/employee.model';

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const {name, email, age} = req.body;
    const createdBy = req?.user?.id;

    const employee = new Employee({
      name,
      email,
      age,
      createdBy,
    });

    await employee.save();

    res.status(201).json({
      data: {
        type: 'employees',
        id: employee._id,
        attributes: {
          name: employee.name,
          email: employee.email,
          age: employee.age,
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt,
        },
      },
      relationships: {
        createdBy: {
          data: {type: 'users', id: employee.createdBy},
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      res.status(400).json({
        errors: [
          {
            status: '400',
            title: 'Validation Error',
            detail: 'Email already exists',
            source: {pointer: '/data/attributes/email'},
          },
        ],
      });
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
