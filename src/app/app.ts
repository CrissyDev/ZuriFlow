import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar'; 
import { Home } from './home/home';
import { HowItWorks } from './how-it-works/how-it-works';
import { FinalCta } from './final-cta/final-cta';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    Navbar, 
    Home,
    HowItWorks,
    FinalCta
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Zuri Flow';
}