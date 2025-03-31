import mongoose, { Schema, Document, models } from "mongoose";

export interface ICategory extends Document {
  category_id: string;
  name: string;
}

const CategorySchema: Schema = new Schema(
  {
    category_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);
