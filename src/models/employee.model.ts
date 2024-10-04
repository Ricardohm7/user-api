import mongoose, {Document, Schema} from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  email: string;
  age: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema: Schema = new Schema(
  {
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    age: {type: Number, required: true},
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {timestamps: true},
);

const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
export default Employee;
