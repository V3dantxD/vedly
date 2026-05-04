import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  googleId?: string;
  defaultCurrency: string;
  timezone: string;
  friends: mongoose.Types.ObjectId[];
  notificationPrefs: { email: boolean; inApp: boolean };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    image: { type: String },
    googleId: { type: String },
    defaultCurrency: { type: String, default: "INR" },
    timezone: { type: String, default: "Asia/Kolkata" },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    notificationPrefs: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
export default User;
