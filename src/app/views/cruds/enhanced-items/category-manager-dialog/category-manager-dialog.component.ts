import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ItemCategory } from '../../enhanced-items.service';

@Component({
  selector: 'app-category-manager-dialog',
  templateUrl: './category-manager-dialog.component.html',
  styleUrls: ['./category-manager-dialog.component.scss'],
  standalone: false
})
export class CategoryManagerDialogComponent implements OnInit {
  categoryForm: FormGroup;
  categories: ItemCategory[] = [];
  editingCategory: ItemCategory | null = null;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<CategoryManagerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categories: ItemCategory[] },
    private fb: FormBuilder
  ) {
    this.categories = data.categories;
  }

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      parentId: [''],
      isActive: [true]
    });
  }

  onAddCategory() {
    this.editingCategory = null;
    this.categoryForm.reset();
    this.categoryForm.patchValue({ isActive: true });
  }

  onEditCategory(category: ItemCategory) {
    this.editingCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      parentId: category.parentId || '',
      isActive: category.isActive
    });
  }

  onDeleteCategory(category: ItemCategory) {
    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      const index = this.categories.findIndex(cat => cat.id === category.id);
      if (index > -1) {
        this.categories.splice(index, 1);
      }
    }
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      
      if (this.editingCategory) {
        // Update existing category
        const index = this.categories.findIndex(cat => cat.id === this.editingCategory!.id);
        if (index > -1) {
          this.categories[index] = {
            ...this.editingCategory,
            ...formValue,
            parentId: formValue.parentId || undefined
          };
        }
      } else {
        // Add new category
        const newCategory: ItemCategory = {
          id: `cat-${Date.now()}`,
          ...formValue,
          parentId: formValue.parentId || undefined,
          createdAt: new Date()
        };
        this.categories.push(newCategory);
      }
      
      this.categoryForm.reset();
      this.editingCategory = null;
    }
  }

  onCancel() {
    this.categoryForm.reset();
    this.editingCategory = null;
  }

  onClose() {
    this.dialogRef.close({ categories: this.categories });
  }

  getParentCategories(): ItemCategory[] {
    return this.categories.filter(cat => !cat.parentId);
  }

  getChildCategories(parentId: string): ItemCategory[] {
    return this.categories.filter(cat => cat.parentId === parentId);
  }

  getCategoryLevel(category: ItemCategory): number {
    if (!category.parentId) return 0;
    const parent = this.categories.find(cat => cat.id === category.parentId);
    return parent ? this.getCategoryLevel(parent) + 1 : 0;
  }

  getCategoryPath(category: ItemCategory): string {
    if (!category.parentId) return category.name;
    const parent = this.categories.find(cat => cat.id === category.parentId);
    return parent ? `${this.getCategoryPath(parent)} > ${category.name}` : category.name;
  }
}
