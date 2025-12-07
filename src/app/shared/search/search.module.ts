import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SearchInputOverComponent } from "./search-input-over/search-input-over.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { SharedDirectivesModule } from "../directives/shared-directives.module";

@NgModule({
  declarations: [],
  exports: [SearchInputOverComponent],
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatIconModule, 
    MatButtonModule, 
    SharedDirectivesModule,
    SearchInputOverComponent
  ]
})
export class SearchModule {}
