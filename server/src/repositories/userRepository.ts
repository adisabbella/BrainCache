import { IUser, User } from '../models/User';

export const userRepository = {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() });
  },

  async findByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username });
  },

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  },

  async create(data: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<IUser> {
    const user = new User({
      username: data.username,
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
    });
    return user.save();
  },
};
