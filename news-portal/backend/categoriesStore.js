import { access, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CATEGORIES_FILE = path.join(__dirname, "categories.json");

async function ensureCategoriesFile() {
  try {
    await access(CATEGORIES_FILE);
  } catch {
    // Initialize with default categories
    const defaultCategories = [
      { id: 1, name: "Công nghệ", createdAt: new Date().toISOString() },
      { id: 2, name: "Kinh doanh", createdAt: new Date().toISOString() },
      { id: 3, name: "Thể thao", createdAt: new Date().toISOString() },
      { id: 4, name: "Giải trí", createdAt: new Date().toISOString() },
      { id: 5, name: "Giáo dục", createdAt: new Date().toISOString() },
      { id: 6, name: "Sức khỏe", createdAt: new Date().toISOString() },
      { id: 7, name: "Môi trường", createdAt: new Date().toISOString() },
      { id: 8, name: "Du lịch", createdAt: new Date().toISOString() },
      { id: 9, name: "Quốc tế", createdAt: new Date().toISOString() }
    ];
    await writeFile(CATEGORIES_FILE, JSON.stringify(defaultCategories, null, 2), "utf8");
  }
}

export async function getCategories() {
  await ensureCategoriesFile();
  const raw = await readFile(CATEGORIES_FILE, "utf8");
  try {
    const categories = JSON.parse(raw);
    return Array.isArray(categories) ? categories : [];
  } catch {
    return [];
  }
}

export async function saveCategories(categories) {
  await writeFile(CATEGORIES_FILE, JSON.stringify(categories, null, 2), "utf8");
}

export async function findCategoryById(id) {
  const categories = await getCategories();
  return categories.find(category => category.id === id) || null;
}

export async function findCategoryByName(name) {
  const categories = await getCategories();
  const normalizedName = String(name || "").trim().toLowerCase();
  return categories.find(category =>
    String(category.name || "").trim().toLowerCase() === normalizedName
  ) || null;
}

export async function createCategory(name) {
  const categories = await getCategories();
  const existingCategory = await findCategoryByName(name);
  if (existingCategory) {
    throw new Error("Danh mục đã tồn tại");
  }

  const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
  const newCategory = {
    id: newId,
    name: String(name).trim(),
    createdAt: new Date().toISOString()
  };
  categories.push(newCategory);
  await saveCategories(categories);
  return newCategory;
}

export async function updateCategory(id, name) {
  const categories = await getCategories();
  const categoryIndex = categories.findIndex(c => c.id === id);
  if (categoryIndex === -1) {
    throw new Error("Danh mục không tồn tại");
  }

  const existingCategory = await findCategoryByName(name);
  if (existingCategory && existingCategory.id !== id) {
    throw new Error("Tên danh mục đã tồn tại");
  }

  categories[categoryIndex].name = String(name).trim();
  await saveCategories(categories);
  return categories[categoryIndex];
}

export async function deleteCategory(id) {
  const categories = await getCategories();
  const filtered = categories.filter(c => c.id !== id);
  if (filtered.length === categories.length) {
    throw new Error("Danh mục không tồn tại");
  }
  await saveCategories(filtered);
  return true;
}

export async function getAllCategories() {
  return await getCategories();
}