import { Component, OnInit } from '@angular/core';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  ngOnInit() {
    const saved = localStorage.getItem('theme');
    document.body.classList.toggle('dark-theme', saved === 'dark');
  }
}
