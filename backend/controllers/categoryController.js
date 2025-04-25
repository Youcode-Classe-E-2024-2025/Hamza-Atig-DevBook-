
const Category = require('../models/Category');


const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

exports.getAllCategories = asyncHandler(async (req, res, next) => {
    const categories = await Category.findAll();
    res.status(200).json(categories);
});

exports.createCategory = asyncHandler(async (req, res, next) => {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Category name is required" });
    }
    const newCategory = await Category.create({ name });
    
    res.status(201).json(newCategory);
});

exports.getCategoryById = asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        
        return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
    const { name } = req.body;
     if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Category name is required for update" });
    }
    const updatedCategory = await Category.update(req.params.id, { name });
    if (!updatedCategory) {
         return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(updatedCategory);
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
    const success = await Category.delete(req.params.id);
    if (!success) {
        return res.status(404).json({ message: "Category not found" });
    }
    
    res.status(204).send();
});
