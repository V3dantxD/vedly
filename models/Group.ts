import mongoose, { Schema, Document, Model } from "mongoose";

export type GroupType = "Home" | "Trip" | "Couple" | "Work" | "Other";
export type MemberRole = "admin" | "member";

export interface IGroupMember {
  userId: mongoose.Types.ObjectId;
  role: MemberRole;
}

export interface IGroup extends Document {
  name: string;
  emoji: string;
  type: GroupType;
  members: IGroupMember[];
  currency: string;
  simplifyDebts: boolean;
  inviteCode: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    emoji: { type: String, default: "👥" },
    type: {
      type: String,
      enum: ["Home", "Trip", "Couple", "Work", "Other"],
      default: "Other",
    },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["admin", "member"], default: "member" },
      },
    ],
    currency: { type: String, default: "INR" },
    simplifyDebts: { type: Boolean, default: true },
    inviteCode: { type: String, unique: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Generate invite code before save
GroupSchema.pre("save", function (next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

const Group: Model<IGroup> = mongoose.models.Group ?? mongoose.model<IGroup>("Group", GroupSchema);
export default Group;
