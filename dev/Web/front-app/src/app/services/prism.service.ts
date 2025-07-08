import { Injectable } from '@angular/core';
import 'prismjs';
import 'prismjs/components/prism-javascript';

declare var Prism: any;

@Injectable({ providedIn: 'root' })
export class PrismService {
  highlightAll(): void {
    Prism.highlightAll();
  }

  highlightElement(element: Element): void {
    Prism.highlightElement(element);
  }
}
