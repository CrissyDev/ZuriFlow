import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-final-cta',
  standalone: true,
  templateUrl: './final-cta.html',
  styleUrl: './final-cta.css',
})
export class FinalCta {
  router = inject(Router);

  goToTracker() {
    this.router.navigate(['/tracker']);
  }
}