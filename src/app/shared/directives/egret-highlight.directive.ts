import {
  Directive,
  ElementRef,
  Attribute,
  OnInit,
  Input,
  Renderer2,
  NgZone,
  SimpleChanges,
  OnChanges,
  OnDestroy,
  ChangeDetectorRef,
  AfterContentInit
} from "@angular/core";
import HighlightJS from "highlight.js";
import { HttpClient } from "@angular/common/http";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Directive({
    host: {
        "[class.hljs]": "true",
        "[innerHTML]": "highlightedCode"
    },
    selector: "[egretHighlight]",
    standalone: false
})
export class EgretHighlightDirective implements OnInit, OnChanges, OnDestroy, AfterContentInit {
  constructor(
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
    private _zone: NgZone,
    private http: HttpClient
  ) {
    this.unsubscribeAll = new Subject();
  }
  // Inner highlighted html
  highlightedCode: string = '';

  @Input() path: string = '';
  
  @Input("egretHighlight") code: string = '';
  private unsubscribeAll: Subject<any>;
  @Input() languages: string[] = [];
  private originalContent: string = '';

  ngAfterContentInit() {
    // Store the original content for use if code input is empty
    this.originalContent = this.el.nativeElement.textContent || '';
  }

  ngOnInit() {
    if (this.code) {
      this.highlightElement(this.code);
    } else if (this.path) {
      this.highlightedCode = "Loading..."
      this.http
        .get(this.path, { responseType: "text" })
        .pipe(takeUntil(this.unsubscribeAll))
        .subscribe(response => {
          this.highlightElement(response, this.languages);
        });
    } else if (this.originalContent) {
      // If code input is empty and no path, use the original content
      this.highlightElement(this.originalContent, this.languages);
    } else {
      // Wait for ngAfterContentInit to get content
      setTimeout(() => {
        if (!this.code && !this.path && this.originalContent) {
          this.highlightElement(this.originalContent, this.languages);
        }
      });
    }
  }

  ngOnDestroy() {
      this.unsubscribeAll.next(1);
      this.unsubscribeAll.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes["code"] &&
      changes["code"].currentValue &&
      changes["code"].currentValue !== changes["code"].previousValue
    ) {
      this.highlightElement(this.code);
    } else if (
      changes["code"] && 
      !changes["code"].currentValue &&
      this.originalContent
    ) {
      // If code was reset to empty, use original content
      this.highlightElement(this.originalContent, this.languages);
    }
  }

  highlightElement(code: string, languages?: string[]) {
    this._zone.runOutsideAngular(() => {
      const res = HighlightJS.highlightAuto(code);
      this.highlightedCode = res.value;
      // this.cdr.detectChanges();
    });
  }
}
