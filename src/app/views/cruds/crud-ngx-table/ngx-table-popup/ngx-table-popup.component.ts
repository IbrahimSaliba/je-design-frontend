import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef as MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CrudService } from '../../crud.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { StockAlertService } from '../../../../shared/services/stock-alert.service';
import { MunicipalityService, Governorate, District, Municipality } from '../../../../shared/services/municipality.service';
import { ReplaySubject, Subject, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, map, switchMap, tap, startWith, catchError } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
    selector: 'app-ngx-table-popup',
    templateUrl: './ngx-table-popup.component.html',
    standalone: false
})
export class NgxTablePopupComponent implements OnInit, OnDestroy {
  public itemForm: UntypedFormGroup;
  public currentRoute: string = '';
  public selectedFiles: File[] = [];
  public previewUrls: string[] = [];
  public filteredContainers: any[] = [];
  public containerSearchCtrl: UntypedFormControl = new UntypedFormControl('');
  public isLoadingContainers: boolean = false;
  public selectedContainer: any | null = null;
  public displayContainerFn = (container?: any) => this.displayContainer(container);
  public isCompressing: boolean = false;
  
  // Lebanese Address System
  public governorates: Governorate[] = [];
  public districts: District[] = [];
  public municipalities: Municipality[] = [];
  public selectedGovernorate: string = '';
  public selectedDistrict: string = '';
  
  // Search controls for dropdowns
  public governorateSearchCtrl: UntypedFormControl = new UntypedFormControl();
  public districtSearchCtrl: UntypedFormControl = new UntypedFormControl();
  public municipalitySearchCtrl: UntypedFormControl = new UntypedFormControl();
  
  // Filtered lists for search
  public filteredGovernorates: ReplaySubject<Governorate[]> = new ReplaySubject<Governorate[]>(1);
  public filteredDistricts: ReplaySubject<District[]> = new ReplaySubject<District[]>(1);
  public filteredMunicipalities: ReplaySubject<Municipality[]> = new ReplaySubject<Municipality[]>(1);
  
  // For cleanup
  protected _onDestroy = new Subject<void>();
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<NgxTablePopupComponent>,
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private crudService: CrudService,
    private navigationService: NavigationService,
    private stockAlertService: StockAlertService,
    private municipalityService: MunicipalityService
  ) { }

  ngOnInit() {
    // Get the current route from the data passed to the dialog
    this.currentRoute = this.data.currentRoute || 'containers';
    this.buildItemForm(this.data.payload);
    
    // Load containers if this is an items form
    if (this.currentRoute === 'items') {
      const existingContainerId = this.data.payload?.container_id || this.data.payload?.containerId;
      this.initializeContainerSearch(existingContainerId ? Number(existingContainerId) : null);
    }
  }
  
          buildItemForm(item) {
            switch(this.currentRoute) {
              case 'containers':
                this.buildContainerForm(item);
                break;
              case 'items':
                this.buildItemsForm(item);
                break;
              case 'clients':
                this.buildClientForm(item);
                break;
              case 'suppliers':
                this.buildSupplierForm(item);
                break;
              default:
                this.buildDefaultForm(item);
                break;
            }
          }
  
  buildContainerForm(item) {
    
    this.itemForm = this.fb.group({
      id: [item.id || ''],
      additionalFees: [item.additionalFees || 0, Validators.required],
      cbm: [item.cbm || 0, Validators.required],
      chinaClearingPrice: [item.chinaClearingPrice || 0, Validators.required],
      chinaFreightFees: [item.chinaFreightFees || 0, Validators.required],
      code: [item.code || '', Validators.required],
      containerPrice: [item.containerPrice || 0, Validators.required],
      customsBrokerName: [item.customsBrokerName || '', Validators.required],
      customsPrice: [item.customsPrice || 0, Validators.required],
      dateOfArrival: [item.dateOfArrival || '', Validators.required],
      dateOfArrivalToWarehouse: [item.dateOfArrivalToWarehouse || '', Validators.required],
      dateOfDeparture: [item.dateOfDeparture || '', Validators.required],
      dateOfLoading: [item.dateOfLoading || '', Validators.required],
      lebaneseAgency: [item.lebaneseAgency || '', Validators.required],
      lebaneseClearingPrice: [item.lebaneseClearingPrice || 0, Validators.required],
      name: [item.name || '', Validators.required],
      pricePerCbm: [item.pricePerCbm || 0, Validators.required],
      shippingAgency: [item.shippingAgency || '', Validators.required],
      shippingPrice: [item.shippingPrice || 0, Validators.required],
      size: [item.size || 20, Validators.required],
      status: [item.status || 'PENDING', Validators.required],
      type: [item.type || 'FULL_CONTAINER', Validators.required]
    });
    
  }
  
          buildItemsForm(item) {
            this.itemForm = this.fb.group({
              id: [item.id || ''],
              code: [item.code || '', Validators.required],
              name: [item.name || '', Validators.required],
              type: [item.type || '', Validators.required],
              size: [item.size || item?.size_label || item?.item_size || ''],
              description: [item.description || ''],
              finalPrice: [item.final_price || item.finalPrice || 0, Validators.required],
              initialPriceGuestCurrency: [item.initial_price_guest_currency || item.initialPriceGuestCurrency || 0],
              initialPriceUsd: [item.initial_price_usd || item.initialPriceUsd || 0],
              minStock: [item.min_stock || item.minStock || 0, Validators.required],
              picture: [item.pictures || item.picture || ''], // Store all pictures array
              piecesPerBox: [item.pieces_per_box || item.piecesPerBox || 0],
              // status field removed - backend will auto-determine based on quantity vs minStock
              totalQuantity: [item.total_quantity || item.totalQuantity || 0, Validators.required],
              containerId: [item.container_id || item.containerId || null, Validators.required],
              color: [item.color || '#000000'], // Hexadecimal color value
              expiryDate: [item.expiry_date || item.expiryDate || ''] // Expiry date
            });
          }

          buildClientForm(item) {
            this.itemForm = this.fb.group({
              id: [item.id || ''],
              name: [item.name || '', Validators.required],
              email: [item.email || '', [Validators.required, Validators.email]],
              phone1: [item.phone1 || '', Validators.required],
              phone2: [item.phone2 || ''],
              phone3: [item.phone3 || ''],
              
              // Lebanese Address System (Optional)
              governorate: [''],
              district: [''],
              municipalityId: [item.municipalityId || ''],
              address: [item.address || '', Validators.required],
              
              clientType: [item.client_type || item.clientType || 'RETAIL', Validators.required],
              preferences: [item.preferences || '']
            });
            
            // Load governorates on form init
            this.loadGovernorates();
            
            // If editing existing client with municipality, load cascading data
            if (item.municipalityId) {
              this.loadExistingMunicipality(item.municipalityId);
            }
          }

          buildSupplierForm(item) {
            this.itemForm = this.fb.group({
              id: [item.id || ''],
              name: [item.name || '', Validators.required],
              code: [item.code || '', Validators.required],
              contactName: [item.contactName || item.contact_name || '', Validators.required],
              email: [item.email || '', [Validators.required, Validators.email]],
              phone: [item.phone || '', Validators.required],
              address: [item.address || '', Validators.required],
              city: [item.city || '', Validators.required],
              country: [item.country || '', Validators.required],
              status: [item.status || 'ACTIVE', Validators.required],
              taxNumber: [item.taxNumber || item.tax_number || ''],
              website: [item.website || ''],
              notes: [item.notes || '']
            });
          }

          buildDefaultForm(item) {
            this.itemForm = this.fb.group({
              name: [item.name || '', Validators.required],
              age: [item.age || ''],
              email: [item.email || ''],
              company: [item.company || ''],
              phone: [item.phone || ''],
              address: [item.address || ''],
              balance: [item.balance || ''],
              isActive: [item.isActive || false]
            });
          }

  submit() {
    const formValue = this.itemForm.value;
    
    // For items, handle the picture field properly
    if (this.currentRoute === 'items') {
      // If there are new preview URLs (user added new images), send all of them
      if (this.previewUrls.length > 0) {
        // Validate all pictures are under size limit
        for (let i = 0; i < this.previewUrls.length; i++) {
          if (this.previewUrls[i].length > 10000) {
            alert(`Image ${i + 1} is still too large after compression. Please try a smaller image or a different format.`);
            return; // Don't submit the form
          }
        }
        
        // Get existing pictures
        const existingPictures = this.getExistingPictures();
        
        // Combine existing + new pictures
        const allPictures = [...existingPictures, ...this.previewUrls];
        
        // Send all pictures as an array
        formValue.pictures = allPictures;
        // Also keep the first picture for backward compatibility
        formValue.picture = allPictures.length > 0 ? allPictures[0] : '';
      } else {
        // No new pictures added, keep existing ones
        const existingPictures = this.getExistingPictures();
        
        if (existingPictures.length > 0) {
          formValue.pictures = existingPictures;
          formValue.picture = existingPictures[0];
        } else {
          formValue.picture = '';
          formValue.pictures = [];
        }
      }
      
      // Ensure numeric fields are properly formatted
      if (formValue.finalPrice === null || formValue.finalPrice === undefined) {
        formValue.finalPrice = 0;
      }
      if (formValue.initialPriceUsd === null || formValue.initialPriceUsd === undefined) {
        formValue.initialPriceUsd = 0;
      }
      if (formValue.initialPriceGuestCurrency === null || formValue.initialPriceGuestCurrency === undefined) {
        formValue.initialPriceGuestCurrency = 0;
      }
      if (formValue.totalQuantity === null || formValue.totalQuantity === undefined) {
        formValue.totalQuantity = 0;
      }
      if (formValue.minStock === null || formValue.minStock === undefined) {
        formValue.minStock = 0;
      }
      if (formValue.piecesPerBox === null || formValue.piecesPerBox === undefined) {
        formValue.piecesPerBox = 0;
      }
      
    }
    
    // If this is an item update, trigger badge update (stock may have changed)
    if (this.currentRoute === 'items' && this.data.payload) {
      setTimeout(() => {
        this.updateStockAlertsBadge();
      }, 1000); // Wait 1 second for backend to process and create notifications
    }
    
    this.dialogRef.close(formValue);
  }
  
  // Update stock alerts badge in sidebar
  private updateStockAlertsBadge() {
    this.stockAlertService.getUnreadStockAlertsCount().subscribe(count => {
      console.log('🔔 ITEMS CRUD: Updating badge count to:', count);
      this.navigationService.updateStockAlertsBadge(count);
    });
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
      this.previewUrls = [];
      this.isCompressing = true;
      
      let processedCount = 0;
      const totalFiles = files.length;
      
      this.selectedFiles.forEach((file, index) => {
        if (file.type.startsWith('image/')) {
          // Check file size (limit to 5MB to allow for compression)
          if (file.size > 5 * 1024 * 1024) {
            alert('Image file is too large. Please select an image smaller than 5MB.');
            processedCount++;
            if (processedCount === totalFiles) {
              this.isCompressing = false;
            }
            return;
          }
          
          // Show loading message
          console.log(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          
          const reader = new FileReader();
          reader.onload = (e: any) => {
            // Compress the image
            this.compressImage(e.target.result, (compressedDataUrl) => {
              this.previewUrls.push(compressedDataUrl);
              console.log(`Image ${file.name} compressed successfully`);
              
              processedCount++;
              if (processedCount === totalFiles) {
                this.isCompressing = false;
              }
            });
          };
          reader.readAsDataURL(file);
        } else {
          processedCount++;
          if (processedCount === totalFiles) {
            this.isCompressing = false;
          }
        }
      });
    }
  }

  compressImage(dataUrl: string, callback: (compressedDataUrl: string) => void) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      let quality = 0.8; // Start with 80% quality
      const maxSize = 400; // Reduced from 800 to 400
      const maxDataUrlLength = 8000; // Leave some buffer under 10,000 limit
      
      // Calculate new dimensions
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw the image
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels until we get under the size limit
      const tryCompress = () => {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        if (compressedDataUrl.length <= maxDataUrlLength || quality <= 0.1) {
          console.log(`Image compressed: ${compressedDataUrl.length} characters, quality: ${quality}`);
          callback(compressedDataUrl);
        } else {
          quality -= 0.1; // Reduce quality by 10%
          setTimeout(tryCompress, 10); // Small delay to prevent blocking
        }
      };
      
      tryCompress();
    };
    
    img.src = dataUrl;
  }

  removeImage(index: number) {
    this.previewUrls.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  getExistingPictures(): string[] {
    const pictureValue = this.itemForm.get('picture')?.value;
    if (!pictureValue) return [];
    
    // If it's an array, return it (backend sends pictures as array)
    if (Array.isArray(pictureValue)) {
      // Filter out empty strings and null values
      return pictureValue.filter(p => p && p.trim() !== '');
    }
    
    // If it's a string, return as single item array
    if (typeof pictureValue === 'string' && pictureValue.trim() !== '') {
      return [pictureValue];
    }
    
    return [];
  }

  removeExistingImage(index: number) {
    const pictures = [...this.getExistingPictures()]; // Create a copy
    pictures.splice(index, 1);
    
    console.log('🗑️ Removing image at index', index);
    console.log('📸 Remaining pictures:', pictures);
    
    // Update the picture field with the remaining pictures array
    if (pictures.length > 0) {
      this.itemForm.patchValue({ picture: pictures }); // Store as array
    } else {
      this.itemForm.patchValue({ picture: [] }); // Empty array
    }
  }

  private initializeContainerSearch(existingContainerId: number | null) {
    this.containerSearchCtrl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        tap(value => {
          if (typeof value === 'string') {
            this.selectedContainer = null;
            if (this.itemForm && this.itemForm.get('containerId')?.value) {
              this.itemForm.patchValue({ containerId: null }, { emitEvent: false });
            }
          }
        }),
        map(value => typeof value === 'string' ? value.trim() : ''),
        distinctUntilChanged(),
        tap(() => this.isLoadingContainers = true),
        switchMap(searchTerm => this.crudService.searchContainers(searchTerm).pipe(
          catchError(() => of([]))
        )),
        takeUntil(this._onDestroy)
      )
      .subscribe(results => {
        this.filteredContainers = Array.isArray(results) ? results : [];
        this.isLoadingContainers = false;
      }, () => {
        this.filteredContainers = [];
        this.isLoadingContainers = false;
      });

    if (existingContainerId) {
      this.fetchContainerById(existingContainerId);
    }
  }

  private fetchContainerById(containerId: number) {
    if (!containerId || isNaN(containerId)) {
      return;
    }

    this.isLoadingContainers = true;
    this.crudService.getContainerById(containerId)
      .pipe(
        takeUntil(this._onDestroy),
        catchError(() => {
          this.isLoadingContainers = false;
          return of(null);
        })
      )
      .subscribe(container => {
        this.isLoadingContainers = false;
        if (container) {
          this.selectedContainer = container;
          if (this.itemForm) {
            this.itemForm.patchValue({ containerId: container.id }, { emitEvent: false });
          }
          this.containerSearchCtrl.setValue(this.displayContainer(container), { emitEvent: false });
          if (!this.filteredContainers.some(c => c.id === container.id)) {
            this.filteredContainers = [container, ...this.filteredContainers];
          }
        }
      });
  }

  onContainerSelected(event: MatAutocompleteSelectedEvent) {
    const container = event.option.value;
    if (container) {
      this.selectedContainer = container;
      this.containerSearchCtrl.setValue(this.displayContainer(container), { emitEvent: false });
      this.itemForm.patchValue({ containerId: container.id });
    }
  }

  clearContainerSelection() {
    this.selectedContainer = null;
    this.containerSearchCtrl.setValue('', { emitEvent: true });
    this.itemForm.patchValue({ containerId: null });
    this.itemForm.get('containerId')?.markAsTouched();
  }

  displayContainer(container: any): string {
    if (!container) {
      return '';
    }
    const code = container.code ? container.code : '';
    const name = container.name ? container.name : '';
    const type = container.type ? container.type : '';
    return `${code}${code && name ? ' - ' : ''}${name}${type ? ` (${type})` : ''}`.trim();
  }
  
  // Lebanese Address System - Cascading Dropdowns
  
  loadGovernorates() {
    this.municipalityService.getGovernorates().subscribe({
      next: (data) => {
        this.governorates = data;
        this.filteredGovernorates.next(data.slice());
        console.log('✅ Loaded governorates:', data.length);
        
        // Listen for search field value changes
        this.governorateSearchCtrl.valueChanges
          .pipe(takeUntil(this._onDestroy))
          .subscribe(() => {
            this.filterGovernorates();
          });
      },
      error: (error) => {
        console.error('❌ Error loading governorates:', error);
      }
    });
  }
  
  filterGovernorates() {
    if (!this.governorates) {
      return;
    }
    // Get search keyword
    let search = this.governorateSearchCtrl.value;
    if (!search) {
      this.filteredGovernorates.next(this.governorates.slice());
      return;
    }
    
    search = search.toLowerCase();
    // Filter by English or Arabic name
    this.filteredGovernorates.next(
      this.governorates.filter(gov => 
        gov.governorate.toLowerCase().includes(search) ||
        (gov.governorateAr && gov.governorateAr.includes(search))
      )
    );
  }
  
  onGovernorateChange(governorate: string) {
    console.log('📍 Governorate selected:', governorate);
    this.selectedGovernorate = governorate;
    this.districts = [];
    this.municipalities = [];
    this.selectedDistrict = '';
    this.itemForm.patchValue({ district: '', municipalityId: '' });
    this.filteredDistricts.next([]);
    this.filteredMunicipalities.next([]);
    
    if (governorate) {
      this.municipalityService.getDistrictsByGovernorate(governorate).subscribe({
        next: (data) => {
          this.districts = data;
          this.filteredDistricts.next(data.slice());
          console.log('✅ Loaded districts:', data.length);
          
          // Listen for district search
          this.districtSearchCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
              this.filterDistricts();
            });
        },
        error: (error) => {
          console.error('❌ Error loading districts:', error);
        }
      });
    }
  }
  
  filterDistricts() {
    if (!this.districts) {
      return;
    }
    let search = this.districtSearchCtrl.value;
    if (!search) {
      this.filteredDistricts.next(this.districts.slice());
      return;
    }
    
    search = search.toLowerCase();
    this.filteredDistricts.next(
      this.districts.filter(dist => 
        dist.district.toLowerCase().includes(search) ||
        (dist.districtAr && dist.districtAr.includes(search))
      )
    );
  }
  
  onDistrictChange(district: string) {
    console.log('📍 District selected:', district);
    this.selectedDistrict = district;
    this.municipalities = [];
    this.itemForm.patchValue({ municipalityId: '' });
    this.filteredMunicipalities.next([]);
    
    if (this.selectedGovernorate && district) {
      this.municipalityService.getMunicipalitiesByDistrict(this.selectedGovernorate, district).subscribe({
        next: (data) => {
          this.municipalities = data;
          this.filteredMunicipalities.next(data.slice());
          console.log('✅ Loaded municipalities:', data.length);
          
          // Listen for municipality search
          this.municipalitySearchCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
              this.filterMunicipalities();
            });
        },
        error: (error) => {
          console.error('❌ Error loading municipalities:', error);
        }
      });
    }
  }
  
  filterMunicipalities() {
    if (!this.municipalities) {
      return;
    }
    let search = this.municipalitySearchCtrl.value;
    if (!search) {
      this.filteredMunicipalities.next(this.municipalities.slice());
      return;
    }
    
    search = search.toLowerCase();
    this.filteredMunicipalities.next(
      this.municipalities.filter(mun => 
        mun.municipalityName.toLowerCase().includes(search) ||
        (mun.municipalityNameAr && mun.municipalityNameAr.includes(search))
      )
    );
  }
  
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
  
  loadExistingMunicipality(municipalityId: string) {
    console.log('🔄 Loading existing municipality:', municipalityId);
    this.municipalityService.getMunicipalityById(municipalityId).subscribe({
      next: (municipality) => {
        console.log('✅ Loaded municipality:', municipality.municipalityName);
        
        // Set governorate
        this.selectedGovernorate = municipality.governorate;
        this.itemForm.patchValue({ governorate: municipality.governorate });
        
        // Load and set districts
        this.municipalityService.getDistrictsByGovernorate(municipality.governorate).subscribe({
          next: (districts) => {
            this.districts = districts;
            this.selectedDistrict = municipality.district;
            this.itemForm.patchValue({ district: municipality.district });
            
            // Load and set municipalities
            this.municipalityService.getMunicipalitiesByDistrict(
              municipality.governorate,
              municipality.district
            ).subscribe({
              next: (municipalities) => {
                this.municipalities = municipalities;
                this.itemForm.patchValue({ municipalityId: municipality.id });
                console.log('✅ Cascading data loaded successfully');
              },
              error: (error) => {
                console.error('❌ Error loading municipalities:', error);
              }
            });
          },
          error: (error) => {
            console.error('❌ Error loading districts:', error);
          }
        });
      },
      error: (error) => {
        console.error('❌ Error loading municipality:', error);
      }
    });
  }
}
