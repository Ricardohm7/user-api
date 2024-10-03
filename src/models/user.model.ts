import mongoose, {Schema} from 'mongoose';
import {IUser} from '../interfaces/user.interface';
import bcrypt from 'bcrypt';
import {appConfig} from '../config/app.config';

const UserSchema: Schema = new Schema(
  {
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: false}, //Only required for v2
  },
  {timestamps: true},
);

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(appConfig.jwtSaltRounds);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
