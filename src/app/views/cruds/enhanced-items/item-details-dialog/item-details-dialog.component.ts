import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { EnhancedItemsService, EnhancedItem, ItemCategory, ItemVariant, ItemImage, ItemStatus } from '../../enhanced-items.service';

@Component({
  selector: 'app-item-details-dialog',
  templateUrl: './item-details-dialog.component.html',
  styleUrls: ['./item-details-dialog.component.scss'],
  standalone: false
})
export class ItemDetailsDialogComponent implements OnInit {
  itemForm: FormGroup;
  categories: ItemCategory[] = [];
  loading = false;
  mode: 'create' | 'edit' | 'view';
  item: EnhancedItem | null = null;

  constructor(
    public dialogRef: MatDialogRef<ItemDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item?: EnhancedItem; mode: 'create' | 'edit' | 'view' },
    private fb: FormBuilder,
    private enhancedItemsService: EnhancedItemsService
  ) {
    this.mode = data.mode;
    this.item = data.item || null;
  }

  ngOnInit() {
    this.loadCategories();
    this.initializeForm();
  }

  private loadCategories() {
    this.enhancedItemsService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  private initializeForm() {
    this.itemForm = this.fb.group({
      // Basic Information
      name: ['', Validators.required],
      code: ['', Validators.required],
      sku: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      
      // Inventory
      quantity: [0, [Validators.required, Validators.min(0)]],
      reorderPoint: [0, [Validators.required, Validators.min(0)]],
      reorderQuantity: [0, [Validators.required, Validators.min(0)]],
      maxStock: [0, [Validators.required, Validators.min(0)]],
      
      // Pricing
      basePrice: [0, [Validators.required, Validators.min(0)]],
      cost: [0, [Validators.required, Validators.min(0)]],
      taxRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      
      // Physical Properties
      weight: [0, [Validators.required, Validators.min(0)]],
      length: [0, [Validators.required, Validators.min(0)]],
      width: [0, [Validators.required, Validators.min(0)]],
      height: [0, [Validators.required, Validators.min(0)]],
      unit: ['pieces', Validators.required],
      
      // Status and Tracking
      status: ['ACTIVE', Validators.required],
      isSerialized: [false],
      isTracked: [true],
      trackExpiry: [false],
      expiryDate: [''],
      
      // Supplier Information
      primarySupplier: ['', Validators.required],
      barcode: [''],
      qrCode: [''],
      
      // Additional Information
      tags: [''],
      notes: [''],
      internalNotes: [''],
      certifications: [''],
      complianceNotes: [''],
      warehouseLocation: [''],
      storageRequirements: [''],
      
      // SEO
      seoTitle: [''],
      seoDescription: [''],
      keywords: [''],
      
      // Variants
      variants: this.fb.array([]),
      
      // Images
      images: this.fb.array([])
    });

    if (this.item) {
      this.populateForm();
    }

    if (this.mode === 'view') {
      this.itemForm.disable();
    }
  }

  private populateForm() {
    if (!this.item) return;

    this.itemForm.patchValue({
      name: this.item.name,
      code: this.item.code,
      sku: this.item.sku,
      description: this.item.description,
      category: this.item.category.id,
      quantity: this.item.quantity,
      reorderPoint: this.item.reorderPoint,
      reorderQuantity: this.item.reorderQuantity,
      maxStock: this.item.maxStock,
      basePrice: this.item.basePrice,
      cost: this.item.cost,
      taxRate: this.item.taxRate,
      weight: this.item.weight,
      length: this.item.dimensions.length,
      width: this.item.dimensions.width,
      height: this.item.dimensions.height,
      unit: this.item.unit,
      status: this.item.status,
      isSerialized: this.item.isSerialized,
      isTracked: this.item.isTracked,
      trackExpiry: this.item.trackExpiry,
      expiryDate: this.item.expiryDate ? this.item.expiryDate.toISOString().split('T')[0] : '',
      primarySupplier: this.item.primarySupplier,
      barcode: this.item.barcode,
      qrCode: this.item.qrCode,
      tags: this.item.tags.join(', '),
      notes: this.item.notes,
      internalNotes: this.item.internalNotes,
      certifications: this.item.certifications.join(', '),
      complianceNotes: this.item.complianceNotes,
      warehouseLocation: this.item.warehouseLocation,
      storageRequirements: this.item.storageRequirements.join(', '),
      seoTitle: this.item.seoTitle,
      seoDescription: this.item.seoDescription,
      keywords: this.item.keywords.join(', ')
    });

    // Populate variants
    const variantsArray = this.itemForm.get('variants') as FormArray;
    variantsArray.clear();
    this.item.variants.forEach(variant => {
      variantsArray.push(this.createVariantFormGroup(variant));
    });

    // Populate images
    const imagesArray = this.itemForm.get('images') as FormArray;
    imagesArray.clear();
    this.item.images.forEach(image => {
      imagesArray.push(this.createImageFormGroup(image));
    });
  }

  private createVariantFormGroup(variant?: ItemVariant): FormGroup {
    return this.fb.group({
      id: [variant?.id || ''],
      name: [variant?.name || '', Validators.required],
      sku: [variant?.sku || '', Validators.required],
      price: [variant?.price || 0, [Validators.required, Validators.min(0)]],
      cost: [variant?.cost || 0, [Validators.required, Validators.min(0)]],
      weight: [variant?.weight || 0, [Validators.required, Validators.min(0)]],
      length: [variant?.dimensions?.length || 0, [Validators.required, Validators.min(0)]],
      width: [variant?.dimensions?.width || 0, [Validators.required, Validators.min(0)]],
      height: [variant?.dimensions?.height || 0, [Validators.required, Validators.min(0)]],
      attributes: [variant?.attributes ? JSON.stringify(variant.attributes) : '{}'],
      isActive: [variant?.isActive ?? true]
    });
  }

  private createImageFormGroup(image?: ItemImage): FormGroup {
    return this.fb.group({
      id: [image?.id || ''],
      url: [image?.url || '', Validators.required],
      alt: [image?.alt || '', Validators.required],
      isPrimary: [image?.isPrimary || false],
      uploadedAt: [image?.uploadedAt || new Date()]
    });
  }

  // Variant management
  get variantsArray(): FormArray {
    return this.itemForm.get('variants') as FormArray;
  }

  addVariant() {
    this.variantsArray.push(this.createVariantFormGroup());
  }

  removeVariant(index: number) {
    this.variantsArray.removeAt(index);
  }

  // Image management
  get imagesArray(): FormArray {
    return this.itemForm.get('images') as FormArray;
  }

  addImage() {
    this.imagesArray.push(this.createImageFormGroup());
  }

  removeImage(index: number) {
    this.imagesArray.removeAt(index);
  }

  setPrimaryImage(index: number) {
    this.imagesArray.controls.forEach((control, i) => {
      control.get('isPrimary')?.setValue(i === index);
    });
  }

  // Form submission
  onSubmit() {
    if (this.itemForm.valid) {
      this.loading = true;
      const formValue = this.itemForm.value;
      
      const itemData = {
        ...formValue,
        category: this.categories.find(cat => cat.id === formValue.category),
        dimensions: {
          length: formValue.length,
          width: formValue.width,
          height: formValue.height
        },
        tags: formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag),
        certifications: formValue.certifications.split(',').map((cert: string) => cert.trim()).filter((cert: string) => cert),
        storageRequirements: formValue.storageRequirements.split(',').map((req: string) => req.trim()).filter((req: string) => req),
        keywords: formValue.keywords.split(',').map((keyword: string) => keyword.trim()).filter((keyword: string) => keyword),
        variants: formValue.variants.map((variant: any) => ({
          ...variant,
          dimensions: {
            length: variant.length,
            width: variant.width,
            height: variant.height
          },
          attributes: JSON.parse(variant.attributes || '{}')
        })),
        images: formValue.images,
        availableQuantity: formValue.quantity,
        reservedQuantity: 0,
        margin: ((formValue.basePrice - formValue.cost) / formValue.basePrice) * 100,
        totalSold: this.item?.totalSold || 0,
        totalRevenue: this.item?.totalRevenue || 0,
        averageRating: this.item?.averageRating || 0,
        reviewCount: this.item?.reviewCount || 0,
        suppliers: this.item?.suppliers || [],
        createdAt: this.item?.createdAt || new Date(),
        createdBy: this.item?.createdBy || 'current-user',
        updatedBy: 'current-user'
      };

      if (this.mode === 'create') {
        this.enhancedItemsService.addItem(itemData).subscribe({
          next: (item) => {
            this.loading = false;
            this.dialogRef.close(item);
          },
          error: (error) => {
            this.loading = false;
            console.error('Error creating item:', error);
          }
        });
      } else if (this.mode === 'edit' && this.item) {
        this.enhancedItemsService.updateItem(this.item.id, itemData).subscribe({
          next: (item) => {
            this.loading = false;
            this.dialogRef.close(item);
          },
          error: (error) => {
            this.loading = false;
            console.error('Error updating item:', error);
          }
        });
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  // Utility methods
  getMargin(): number {
    const basePrice = this.itemForm.get('basePrice')?.value || 0;
    const cost = this.itemForm.get('cost')?.value || 0;
    return basePrice > 0 ? ((basePrice - cost) / basePrice) * 100 : 0;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}
