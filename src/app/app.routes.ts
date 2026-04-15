import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Tracker } from './tracker/tracker';

export const routes: Routes = [
  { path: '', component: Home }, 
  { path: 'tracker', component: Tracker }
];