import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { OnChanges } from '@angular/core/src/metadata/lifecycle_hooks';


@Component({
  selector: 'app-shortened-text',
  templateUrl: './shortened-text.component.html',
  styleUrls: ['./shortened-text.component.css']
})
export class ShortenedTextComponent implements OnInit, OnChanges {

  constructor() { }

  @Input()
  text: string;
  @Input()
  position: number | null;
  @Input()
  showText: string;
  @Input()
  hideText: string;
  @Input()
  showLink: boolean | null;
  @Input()
  showTooltip: boolean | null;
  displayedText = '';
  linkText = '';
  textShownFull = false;
  toolTip = '';

  ngOnInit() {
    if (this.position == null) {
      this.position = 80;
    }

    if (this.showText == null) {
      this.showText = 'Više';
    }

    if (this.hideText == null) {
      this.hideText = 'Manje';
    }

    if (this.showLink == null) {
      this.showLink = true;
    }

    if (this.showTooltip == null) {
      this.showTooltip = true;
    }

    this.initializeText();

    if (this.showTooltip && this.text &&  this.text.length > this.position) {
      this.toolTip = this.text;
    } else {
      this.toolTip = '';
    }

  }

  initializeText() {
    if (this.text != null && this.text.length > this.position) {
      this.displayedText = this.text.substring(0, this.position) + '...';
      this.linkText = this.showText;
    } else {
        this.displayedText = this.text;
    }
  }

  linkClick() {
      if (!this.textShownFull) {
          this.displayedText = this.text;
          this.linkText = this.hideText;
      } else {
          this.displayedText = this.text.substring(0, this.position) + '...';
          this.linkText = this.showText;
      }
      this.textShownFull = !this.textShownFull;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.initializeText();
  }

}
