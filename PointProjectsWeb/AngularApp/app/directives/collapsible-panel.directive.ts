import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appCollapsiblePanel]'
})
export class CollapsiblePanelDirective implements OnInit {

  el: ElementRef;

  ngOnInit(): void {
    const header = this.el.nativeElement.firstElementChild;
    const body = header.nextElementSibling;
    const doc = header.ownerDocument;
    header.insertAdjacentHTML('beforeend', '<button class="btn-primary pull-right glyphicon glyphicon-menu-up"></button>');
  }


  constructor(el: ElementRef) {
    this.el = el;
  }



}
