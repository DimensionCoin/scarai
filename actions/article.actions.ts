"use server";
import { connect } from "@/db";
import Article from "@/models/article.model";

// 🔹 **CREATE an AI-Generated Article**
export async function createArticle(data: {
  title: string;
  content: string;
  tags?: string[];
}) {
  await connect();
  return await Article.create(data);
}

// 🔹 **GET All Articles**
export async function getAllArticles() {
  await connect();
  return await Article.find().sort({ createdAt: -1 });
}

// 🔹 **GET a Single Article by ID**
export async function getArticleById(articleId: string) {
  await connect();
  return await Article.findById(articleId);
}

// 🔹 **UPDATE an Article**
export async function updateArticle(
  articleId: string,
  updateData: Partial<{
    title: string;
    content: string;
    tags: string[];
    published: boolean;
  }>
) {
  await connect();
  return await Article.findByIdAndUpdate(articleId, updateData, { new: true });
}

// 🔹 **DELETE an Article**
export async function deleteArticle(articleId: string) {
  await connect();
  return await Article.findByIdAndDelete(articleId);
}
