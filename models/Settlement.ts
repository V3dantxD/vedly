import mongoose, { Schema, Document, Model } from "mongoose";

// Settlement
export interface ISettlement extends Document {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  groupId?: mongoose.Types.ObjectId;
  paymentMethod: "Cash" | "UPI" | "Bank Transfer" | "PayPal" | "Other";
  date: Date;
  note?: string;
  createdAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    groupId: { type: Schema.Types.ObjectId, ref: "Group" },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "PayPal", "Other"],
      default: "Cash",
    },
    date: { type: Date, default: Date.now },
    note: { type: String },
  },
  { timestamps: true }
);

export const Settlement: Model<ISettlement> =
  mongoose.models.Settlement ?? mongoose.model<ISettlement>("Settlement", SettlementSchema);

// Notification
export type NotificationType =
  | "expense_added" | "expense_edited" | "settlement_received"
  | "added_to_group" | "friend_added";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  relatedId?: mongoose.Types.ObjectId;
  relatedModel?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["expense_added", "expense_edited", "settlement_received", "added_to_group", "friend_added"],
      required: true,
    },
    message: { type: String, required: true },
    relatedId: { type: Schema.Types.ObjectId },
    relatedModel: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification: Model<INotification> =
  mongoose.models.Notification ?? mongoose.model<INotification>("Notification", NotificationSchema);

// Activity
export interface IActivity extends Document {
  actorId: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  groupId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    metadata: { type: Schema.Types.Mixed },
    groupId: { type: Schema.Types.ObjectId, ref: "Group" },
  },
  { timestamps: true }
);

export const Activity: Model<IActivity> =
  mongoose.models.Activity ?? mongoose.model<IActivity>("Activity", ActivitySchema);
