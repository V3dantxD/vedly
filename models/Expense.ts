import mongoose, { Schema, Document, Model } from "mongoose";

export type ExpenseCategory =
  | "Food" | "Travel" | "Accommodation" | "Utilities"
  | "Entertainment" | "Shopping" | "Healthcare" | "Education" | "Other";

export type SplitType = "equal" | "exact" | "percent" | "shares" | "adjustment";

export interface IPaidBy {
  userId: mongoose.Types.ObjectId;
  amount: number;
}

export interface ISplit {
  userId: mongoose.Types.ObjectId;
  amount: number;
  splitType: SplitType;
}

export interface IExpense extends Document {
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidBy: IPaidBy[];
  splits: ISplit[];
  groupId?: mongoose.Types.ObjectId;
  date: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    category: {
      type: String,
      enum: ["Food", "Travel", "Accommodation", "Utilities", "Entertainment", "Shopping", "Healthcare", "Education", "Other"],
      default: "Other",
    },
    paidBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
      },
    ],
    splits: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        splitType: {
          type: String,
          enum: ["equal", "exact", "percent", "shares", "adjustment"],
          default: "equal",
        },
      },
    ],
    groupId: { type: Schema.Types.ObjectId, ref: "Group" },
    date: { type: Date, default: Date.now },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Expense: Model<IExpense> = mongoose.models.Expense ?? mongoose.model<IExpense>("Expense", ExpenseSchema);
export default Expense;
