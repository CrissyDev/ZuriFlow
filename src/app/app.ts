import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar'; 
import { Home } from './home/home';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    Navbar, 
    Home
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Zuri Flow';
}